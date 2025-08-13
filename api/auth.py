from http.server import BaseHTTPRequestHandler
import json
import os
import hashlib
import time

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            if self.path.endswith('/register'):
                self.handle_register(data)
            elif self.path.endswith('/login') or self.path.endswith('/token'):
                self.handle_login(data)
            else:
                self.send_error(404, "Endpoint not found")
        except Exception as e:
            self.send_error(500, str(e))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def handle_register(self, data):
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('full_name')
        
        if not email or not password or not full_name:
            self.send_error(400, "Missing required fields")
            return
        
        user_data = {
            'id': int(time.time()),
            'email': email,
            'full_name': full_name,
            'role': 'vendor',
            'is_active': True
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(user_data).encode())
    
    def handle_login(self, data):
        email = data.get('username') or data.get('email')
        password = data.get('password')
        
        if not email or not password:
            self.send_error(400, "Missing credentials")
            return
        
        # Simple token generation (use proper JWT in production)
        token = hashlib.sha256(f"{email}{time.time()}".encode()).hexdigest()
        
        response = {
            'access_token': token,
            'token_type': 'bearer'
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())