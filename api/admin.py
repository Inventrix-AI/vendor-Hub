import json
import time
from typing import Dict, Any

def handler(request, response):
    """Vercel serverless function for admin operations"""
    
    try:
        if request.method == 'GET':
            if '/applications' in request.url:
                return handle_get_applications(request)
            elif '/dashboard' in request.url:
                return handle_dashboard_stats(request)
        elif request.method == 'PUT':
            return handle_update_application_status(request)
        else:
            return {
                'statusCode': 405,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'})
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def handle_get_applications(request):
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
        },
        {
            'id': 3,
            'company_name': 'Food Distributors LLC',
            'contact_email': 'sales@fooddist.com',
            'business_type': 'Food & Beverage',
            'status': 'rejected',
            'submitted_at': '2024-01-17 09:15:00',
            'rejection_reason': 'Incomplete documentation'
        }
    ]
    
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(applications)
    }

def handle_dashboard_stats(request):
    """Get dashboard statistics for admin"""
    stats = {
        'total_applications': 15,
        'pending_applications': 8,
        'approved_applications': 5,
        'rejected_applications': 2,
        'recent_activity': [
            {
                'id': 1,
                'action': 'New application submitted',
                'company': 'Tech Solutions Inc',
                'timestamp': '2024-01-15 10:30:00'
            },
            {
                'id': 2,
                'action': 'Application approved',
                'company': 'Green Supplies Co',
                'timestamp': '2024-01-16 14:20:00'
            }
        ]
    }
    
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(stats)
    }

def handle_update_application_status(request):
    """Update application status (approve/reject)"""
    data = json.loads(request.body)
    application_id = data.get('id')
    new_status = data.get('status')
    rejection_reason = data.get('rejection_reason', '')
    
    if not application_id or not new_status:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing application ID or status'})
        }
    
    updated_application = {
        'id': application_id,
        'status': new_status,
        'updated_at': time.strftime('%Y-%m-%d %H:%M:%S'),
        'rejection_reason': rejection_reason if new_status == 'rejected' else None
    }
    
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(updated_application)
    }