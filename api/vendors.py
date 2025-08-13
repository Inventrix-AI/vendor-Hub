import json
import time
import os
from typing import Dict, Any

def handler(request, response):
    """Vercel serverless function for vendor operations"""
    
    try:
        if request.method == 'POST':
            return handle_vendor_application(request)
        elif request.method == 'GET':
            return handle_get_vendors(request)
        elif request.method == 'PUT':
            return handle_update_vendor(request)
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

def handle_vendor_application(request):
    """Handle new vendor application"""
    data = json.loads(request.body)
    
    # Validate required fields
    required_fields = ['company_name', 'contact_email', 'phone', 'business_type']
    for field in required_fields:
        if not data.get(field):
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Missing required field: {field}'})
            }
    
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
    
    return {
        'statusCode': 201,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(application)
    }

def handle_get_vendors(request):
    """Get vendor applications or specific vendor"""
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
    
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(vendors)
    }

def handle_update_vendor(request):
    """Update vendor status"""
    data = json.loads(request.body)
    vendor_id = data.get('id')
    new_status = data.get('status')
    
    if not vendor_id or not new_status:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing vendor ID or status'})
        }
    
    updated_vendor = {
        'id': vendor_id,
        'status': new_status,
        'updated_at': time.strftime('%Y-%m-%d %H:%M:%S')
    }
    
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(updated_vendor)
    }