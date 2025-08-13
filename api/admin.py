from http.server import BaseHTTPRequestHandler
import json
import time

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if '/applications' in self.path:
            self.handle_get_applications()
        else:
            self.handle_dashboard_stats()
    
    def do_PUT(self):
        self.handle_update_application_status()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def handle_get_applications(self):
        """Get all vendor applications for admin review"""
        applications = [
            {
                'id': 1,
                'company_name': 'Tech Solutions Inc',
                'contact_email': 'contact@techsolutions.com',
                'business_type': 'Technology',
                'status': 'pending',
                'submitted_at': '2024-01-15 10:30:00',
                'documents': ['business_license.pdf', 'tax_certificate.pdf']
            },
            {
                'id': 2,
                'company_name': 'Green Supplies Co',
                'contact_email': 'info@greensupplies.com',
                'business_type': 'Environmental',
                'status': 'approved',
                'submitted_at': '2024-01-16 14:20:00',
                'documents': ['license.pdf']
            }
        ]
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(applications).encode())
    
    def handle_dashboard_stats(self):
        """Get dashboard statistics for admin"""
        stats = {
            'total_applications': 15,
            'pending_applications': 8,
            'approved_applications': 5,
            'rejected_applications': 2
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(stats).encode())
    
    def handle_update_application_status(self):
        """Update application status (approve/reject)"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            application_id = data.get('id')
            new_status = data.get('status')
            
            if not application_id or not new_status:
                self.send_error(400, 'Missing application ID or status')
                return
            
            updated_application = {
                'id': application_id,
                'status': new_status,
                'updated_at': time.strftime('%Y-%m-%d %H:%M:%S')
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(updated_application).encode())
            
        except Exception as e:
            self.send_error(500, str(e))