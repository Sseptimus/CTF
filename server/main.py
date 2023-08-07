from functools import cached_property
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qsl, urlparse
from dataclasses import dataclass
import json
import threading, time

@dataclass
class Location:
    latitude: float
    longitude: float
    
PLAYER_DATA = {}
PASSWORD = "men"

def backup():
    with open("backup.json", "w") as f:
        f.write(json.dumps(PLAYER_DATA))
        
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
    
    res = old
    
    for key in new:
        if key not in res:
            res[key] = new[key]
        else:
            res[key] = merge_json(res[key], new[key])
    
    return old | new

def handle_json_set_post(handler):
    print(handler.query_data)
    player_id = int(handler.query_data["player_id"])
    
    data = handler.json_data
    
    if "password" in data:
        del data["password"]
    
    if player_id not in PLAYER_DATA:
        PLAYER_DATA[player_id] = data
    else:
        PLAYER_DATA[player_id] = merge_json(PLAYER_DATA[player_id], data)
    
    handler.do_Ok()
    
def handle_json_get(handler):
    player_id = int(handler.query_data["player_id"])
    
    data = PLAYER_DATA.get(player_id)
    
    if data is None:
        handler.do_404()
    else:
        handler.send_response(200)
        handler.send_header("Content-Type", "application/json")
        handler.end_headers()
        handler.wfile.write(json.dumps(data).encode("utf-8"))
        
def handle_get_all(handler):
    handler.send_response(200)
    handler.send_header("Content-Type", "application/json")
    handler.end_headers()
    handler.wfile.write(json.dumps(PLAYER_DATA).encode("utf-8"))
        
POST_ROUTES = {
    "/set_data": handle_json_set_post,
}

GET_ROUTES = {
    "/get_data": handle_json_get,
    "/get_all": handle_get_all,
}

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
        return SimpleCookie(self.headers.get("Cookie"))
    
    def verify_password(self):
        valid = False
        
        if "password" in self.cookies:
            password = self.cookies["password"].value
            valid = password == PASSWORD
        
        try:
            if "password" in self.json_data:
                password = self.json_data["password"]
                valid = password == PASSWORD
        except:
            pass
            
        if not valid:
            self.send_response(401)
            self.end_headers()
            self.wfile.write(b"Unauthorized")
            
        return valid
    
    def do_POST(self):
        if not self.verify_password(): return
        
        if self.url.path in POST_ROUTES:
            POST_ROUTES[self.url.path](self)
        else:
            self.do_404()
            
    def do_GET(self):
        if not self.verify_password(): return
        
        if self.url.path in GET_ROUTES:
            GET_ROUTES[self.url.path](self)
        else:
            self.do_404()
            
    def do_404(self):
        self.send_response(404)
        self.end_headers()
        self.wfile.write(b"Not found")
        
    def do_Ok(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"Ok")
        
KILL = False
def auto_backup():
    while True:
        time.sleep(20)
        backup()

if __name__ == "__main__":
    from http.server import HTTPServer
    
    # Launch backup thread
    thread = threading.Thread(target=auto_backup)
    thread.start()
    
    server = HTTPServer(("localhost", 8000), WebRequestHandler)
    print(f"{server.server_address[0]}:{server.server_address[1]}")
    try:
        server.serve_forever()
    except KeyboardInterrupt as e:
        KILL = True
        backup()
        
        print("Stopping server...")
        
        thread.join()
        
        print("Server stopped")