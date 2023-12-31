from functools import cached_property
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qsl, urlparse
from dataclasses import dataclass
import random
import json
import threading
import time, os
import traceback

PORT = 8100
DOMAIN = "localhost"
CORS_ALLOW_ORIGIN = "*"
MESSAGES = {}

@dataclass
class Message:
    from_id: int
    time_received: float
    content: object

def generate_random_string(length):
    chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    return "".join([random.choice(chars) for _ in range(length)])


@dataclass
class Location:
    latitude: float
    longitude: float


PLAYER_DATA = {}
PASSWORD = generate_random_string(12)


def backup():
    with open("backup.json", "w") as f:
        f.write(json.dumps(PLAYER_DATA, indent=2))


def load_backup():
    global PLAYER_DATA

    try:
        with open("backup.json", "r") as f:
            PLAYER_DATA = json.loads(f.read())
    except:
        pass


def merge_json(old, new):
    if type(old) != type(new):
        return new
    
    if not isinstance(old, dict):
        return new

    res = old

    for key in new:
        if key not in res:
            res[key] = new[key]
        else:
            res[key] = merge_json(res[key], new[key])

    return old | new


def handle_json_set_post(handler):
    print(handler.query_data)
    player_id = str(handler.query_data["player_id"])

    data = handler.json_data

    if "password" in data:
        del data["password"]

    if player_id not in PLAYER_DATA:
        PLAYER_DATA[player_id] = data
        print("New player", player_id, data)
    else:
        PLAYER_DATA[player_id] = merge_json(PLAYER_DATA[player_id], data)

    handler.do_Ok()

def handle_reset_hard(handler):
    global PLAYER_DATA
    
    print("Received request to reset!")
    
    backup_name = "backup_" + str(int(time.time())) + ".json"
    
    print("Backing up to", backup_name)
    
    with open(backup_name, "w") as f:
        f.write(json.dumps(PLAYER_DATA))
        
    print("Resetting")
    
    PLAYER_DATA = {}
    
    handler.send_response(200)
    handler.send_header("Content-Type", "text/plain")
    handler.send_header("Access-Control-Allow-Origin", CORS_ALLOW_ORIGIN)
    handler.send_header("Access-Control-Allow-Credentials", "true")
    handler.end_headers()
    handler.wfile.write(b"Reset complete - saved backup to " + backup_name.encode("utf-8"))
    
def handle_post_resource(handler):
    if "ext" in handler.query_data:
        extension = handler.query_data["ext"]
    else:
        extension = None
        
    data = handler.post_data
    
    filename = "resources/" + generate_random_string(20)
    
    if extension is not None:
        filename += "." + extension
        
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    
    with open(filename, "wb") as f:
        f.write(data)
        
    handler.send_response(200)
    handler.send_header("Content-Type", "text/plain")
    handler.send_header("Access-Control-Allow-Origin", CORS_ALLOW_ORIGIN)
    handler.send_header("Access-Control-Allow-Credentials", "true")
    handler.end_headers()
    handler.wfile.write(filename.encode("utf-8"))
    
def handle_send_message(handler):
    sender_id = int(handler.query_data["sender_id"])
    target_ids = [int(x) for x in handler.query_data["target_ids"].split(",")]
    
    data = handler.json_data
    
    for target_id in target_ids:
        if target_id not in MESSAGES:
            MESSAGES[target_id] = []
            
        MESSAGES[target_id].append(Message(sender_id, time.time(), data))
        
    handler.do_Ok()
        
def clear_expired_messages():
    for player_id in MESSAGES:
        messages = MESSAGES[player_id]
        
        for i in range(len(messages) - 1, -1, -1):
            if time.time() - messages[i].time_received > 60:
                del messages[i]
                
def handle_get_messages(handler):
    player_id = int(handler.query_data["player_id"])
    clear_expired_messages()
    
    if player_id not in MESSAGES:
        MESSAGES[player_id] = []
    
    obj = []
    
    for message in MESSAGES[player_id]:
        obj.append({
            "from_id": message.from_id,
            "content": message.content
        })
        
    MESSAGES[player_id] = []
    
    handler.send_response(200)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Access-Control-Allow-Origin", CORS_ALLOW_ORIGIN)
    handler.send_header("Access-Control-Allow-Credentials", "true")
    handler.end_headers()
    handler.wfile.write(json.dumps(obj).encode("utf-8"))
     
def handle_json_get(handler):
    player_id = str(handler.query_data["player_id"])

    data = PLAYER_DATA.get(player_id)

    if data is None:
        handler.do_404()
    else:
        handler.send_response(200)
        handler.send_header("Content-Type", "application/json")
        handler.send_header("Access-Control-Allow-Origin", CORS_ALLOW_ORIGIN)
        handler.send_header("Access-Control-Allow-Credentials", "true")
        handler.end_headers()
        handler.wfile.write(json.dumps(data).encode("utf-8"))


def handle_get_all(handler):
    handler.send_response(200)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Access-Control-Allow-Origin", CORS_ALLOW_ORIGIN)
    handler.send_header("Access-Control-Allow-Credentials", "true")
    handler.end_headers()
    handler.wfile.write(json.dumps(PLAYER_DATA).encode("utf-8"))


POST_ROUTES = {
    "/set_data": handle_json_set_post,
    "/reset_hard": handle_reset_hard,
    "/post_resource": handle_post_resource,
    "/send_message": handle_send_message,
}

GET_ROUTES = {
    "/get_data": handle_json_get,
    "/get_all": handle_get_all,
    "/get_messages": handle_get_messages,
}

PUBLIC_DIRS = [
    "/resources",
]

FILE_TYPES = {
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "gif": "image/gif",
    "svg": "image/svg+xml",
    "js": "application/javascript",
    "css": "text/css",
    "html": "text/html",
    "txt": "text/plain",
    "json": "application/json",
    "ico": "image/x-icon",
    "mp3": "audio/mpeg",
    "wav": "audio/wav",
    "ogg": "audio/ogg",
    "mp4": "video/mp4",
    "webm": "video/webm",
    "pdf": "application/pdf",
    "zip": "application/zip",
    "gz": "application/gzip",
    "tar": "application/x-tar",
}

def get_file_type(filename):
    if "." not in filename:
        return "application/octet-stream"
    
    ext = filename.split(".")[-1]
    
    if ext in FILE_TYPES:
        return FILE_TYPES[ext]
    
    return "application/octet-stream"

class WebRequestHandler(BaseHTTPRequestHandler):
    @cached_property
    def url(self):
        return urlparse(self.path)

    @cached_property
    def query_data(self):
        return dict(parse_qsl(self.url.query))

    @cached_property
    def post_data(self):
        content_length = int(self.headers.get("Content-Length", 0))
        data = self.rfile.read(content_length)

        return data

    @cached_property
    def json_data(self):
        return json.loads(self.post_data.decode("utf-8"))

    @cached_property
    def form_data(self):
        return dict(parse_qsl(self.post_data.decode("utf-8")))

    @cached_property
    def cookies(self):
        cookies = SimpleCookie(self.headers.get("Cookie"))
        return cookies

    def verify_password(self):
        valid = False

        password = None
        if "password" in self.cookies:
            password = self.cookies["password"].value
            valid = password == PASSWORD
            
        #Get from headers
        if not valid:
            try:
                if "password" in self.headers:
                    password = self.headers["password"]
                    valid = password == PASSWORD
            except:
                pass

        try:
            if "password" in self.json_data:
                password = self.json_data["password"]
                valid = password == PASSWORD
        except:
            pass

        if not valid:
            self.send_response(401)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Access-Control-Allow-Origin", CORS_ALLOW_ORIGIN)
            self.send_header("Access-Control-Allow-Credentials", "true")
            self.end_headers()
            self.wfile.write(b"Unauthorized")
            
            print("Auth failed")
            if password is not None:
                print("Password:", password, "Expected: ", PASSWORD)
            else:
                print("No password supplied")
                print("Body:", self.post_data.decode("utf-8"))

        return valid

    def do_POST(self):
        try:
            if not self.verify_password():
                return

            if self.url.path in POST_ROUTES:
                POST_ROUTES[self.url.path](self)
            else:
                self.do_404()
        except Exception as e:
            print("Error in POST request:", e)
            traceback.print_exc()
            self.send_response(500)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Access-Control-Allow-Origin", CORS_ALLOW_ORIGIN)
            self.send_header("Access-Control-Allow-Credentials", "true")
            self.end_headers()
            self.wfile.write(b"Internal Server Error")

    def do_GET(self):
        try:
            if not self.verify_password():
                return

            if self.url.path in GET_ROUTES:
                GET_ROUTES[self.url.path](self)
                return
            elif ".." not in self.url.path:
                print("looking for file")
                print(self.url.path)
                for public_dir in PUBLIC_DIRS:
                    if self.url.path.startswith(public_dir):
                        print("File is in public dir", public_dir)
                        self.do_file()
                        return

            print("File not found")
            self.do_404()
        except Exception as e:
            print("Error in GET request:", e)
            traceback.print_exc()
            self.send_response(500)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Access-Control-Allow-Origin", CORS_ALLOW_ORIGIN)
            self.send_header("Access-Control-Allow-Credentials", "true")
            self.end_headers()
            self.wfile.write(b"Internal Server Error")
            
    def do_file(self):
        path = self.url.path
        
        if path.startswith("/"):
            path = path[1:]
            
        print("Path:", path)
            
        #Check if file exists
        if not os.path.exists(path):
            print("File does not exist")
            self.do_404()
            return
        
        #Check if file is a directory
        if os.path.isdir(path):
            print("File is a directory")
            self.do_404()
            return
        
        print("File exists")
        
        #Get file type
        file_type = get_file_type(path)
        
        #Send file
        self.send_response(200)
        self.send_header("Content-Type", file_type)
        self.send_header("Access-Control-Allow-Origin", CORS_ALLOW_ORIGIN)
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.end_headers()
        
        with open(path, "rb") as f:
            self.wfile.write(f.read())

    def do_404(self):
        self.send_response(404)
        self.send_header("Content-Type", "text/plain")
        self.send_header("Access-Control-Allow-Origin", CORS_ALLOW_ORIGIN)
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.end_headers()
        self.wfile.write(b"Not found")

    def do_Ok(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.send_header("Access-Control-Allow-Origin", CORS_ALLOW_ORIGIN)
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.end_headers()
        self.wfile.write(b"Ok")
        
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", CORS_ALLOW_ORIGIN)
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "X-PINGOTHER, Content-Type, password")
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.end_headers()
        
    


KILL = False


def auto_backup():
    while not KILL:
        time.sleep(5)
        backup()


if __name__ == "__main__":
    from http.server import HTTPServer
    
    load_backup()

    # Launch backup thread
    thread = threading.Thread(target=auto_backup)
    thread.start()
    
    server = HTTPServer((DOMAIN, PORT), WebRequestHandler)
    print(f"{server.server_address[0]}:{server.server_address[1]}")
    print(f"Password: {PASSWORD}")
    try:
        server.serve_forever()
    except KeyboardInterrupt as e:
        KILL = True
        backup()

        print("Stopping server...")

        thread.join()

        print("Server stopped")
