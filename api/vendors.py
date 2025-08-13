from http.server import BaseHTTPRequestHandler
import json
import time

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        self.handle_vendor_application()
    
    def do_GET(self):
        self.handle_get_vendors()
    
    def do_PUT(self):
        self.handle_update_vendor()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def handle_vendor_application(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Validate required fields
            required_fields = ['company_name', 'contact_email', 'phone', 'business_type']
            for field in required_fields:
                if not data.get(field):
                    self.send_error(400, f'Missing required field: {field}')
                    return
            
            # Create vendor application
            application = {
                'id': int(time.time()),
                'company_name': data['company_name'],
                'contact_email': data['contact_email'],
                'phone': data['phone'],
                'business_type': data['business_type'],
                'business_description': data.get('business_description', ''),
                'status': 'pending',
                'submitted_at': time.strftime('%Y-%m-%d %H:%M:%S'),
                'documents': data.get('documents', [])
            }
            
            self.send_response(201)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(application).encode())
            
        except Exception as e:
            self.send_error(500, str(e))
    
    def handle_get_vendors(self):
        # Mock data for demo
        vendors = [
            {
                'id': 1,
                'company_name': 'Tech Solutions Inc',
                'contact_email': 'contact@techsolutions.com',
                'phone': '+1234567890',
                'business_type': 'Technology',
                'status': 'approved',
                'submitted_at': '2024-01-15 10:30:00'
            },
            {
                'id': 2,
                'company_name': 'Green Supplies Co',
                'contact_email': 'info@greensupplies.com',
                'phone': '+1234567891',
                'business_type': 'Environmental',
                'status': 'pending',
                'submitted_at': '2024-01-16 14:20:00'
            }
        ]
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(vendors).encode())
    
    def handle_update_vendor(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            vendor_id = data.get('id')
            new_status = data.get('status')
            
            if not vendor_id or not new_status:
                self.send_error(400, 'Missing vendor ID or status')
                return
            
            updated_vendor = {
                'id': vendor_id,
                'status': new_status,
                'updated_at': time.strftime('%Y-%m-%d %H:%M:%S')
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(updated_vendor).encode())
            
        except Exception as e:
            self.send_error(500, str(e))