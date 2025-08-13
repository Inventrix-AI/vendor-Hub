from http.server import BaseHTTPRequestHandler
import json
import os
from urllib.parse import parse_qs
import hashlib
import hmac
import time
import jwt
import sqlite3
from typing import Optional

# Simple in-memory database setup for demo
# In production, use a proper database service like PlanetScale or Supabase

class AuthHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/auth/register':
            self.handle_register()
        elif self.path == '/api/auth/login':
            self.handle_login()
        else:
            self.send_error(404, "Endpoint not found")
    
    def handle_register(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            email = data.get('email')
            password = data.get('password')
            full_name = data.get('full_name')
            
            if not email or not password or not full_name:
                self.send_error(400, "Missing required fields")
                return
            
            # Hash password
            hashed_password = hashlib.sha256(password.encode()).hexdigest()
            
            # Create user response
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
            
        except Exception as e:
            self.send_error(500, str(e))
    
    def handle_login(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            email = data.get('username') or data.get('email')
            password = data.get('password')
            
            if not email or not password:
                self.send_error(400, "Missing credentials")
                return
            
            # Generate JWT token (simplified)
            secret = os.environ.get('JWT_SECRET', 'your-secret-key')
            payload = {
                'sub': email,
                'role': 'vendor',
                'exp': int(time.time()) + 3600  # 1 hour
            }
            
            token = jwt.encode(payload, secret, algorithm='HS256')
            
            response = {
                'access_token': token,
                'token_type': 'bearer'
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_error(500, str(e))

def handler(request, response):
    """Vercel serverless function handler"""
    try:
        if request.method == 'POST':
            if request.url.endswith('/register'):
                return handle_register_vercel(request)
            elif request.url.endswith('/login'):
                return handle_login_vercel(request)
        
        return {
            'statusCode': 404,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Endpoint not found'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def handle_register_vercel(request):
    data = json.loads(request.body)
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    
    if not email or not password or not full_name:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing required fields'})
        }
    
    user_data = {
        'id': int(time.time()),
        'email': email,
        'full_name': full_name,
        'role': 'vendor',
        'is_active': True
    }
    
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(user_data)
    }

def handle_login_vercel(request):
    data = json.loads(request.body)
    email = data.get('username') or data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing credentials'})
        }
    
    # Generate JWT token
    secret = os.environ.get('JWT_SECRET', 'your-secret-key')
    payload = {
        'sub': email,
        'role': 'vendor',
        'exp': int(time.time()) + 3600
    }
    
    token = jwt.encode(payload, secret, algorithm='HS256')
    
    response = {
        'access_token': token,
        'token_type': 'bearer'
    }
    
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(response)
    }