# Complete Fix Summary - Certificate Generation & Missing Fields

## Problem Identified
1. Registration form collects `gender` and `age` but they weren't being saved to database
2. Existing Bhopal vendor showing only 1 certificate instead of 2
3. Certificate generation logic requires gender + city data

## All Code Changes Completed ✅

### 1. Database Migration File
**File**: [database/migrations/add_certificate_types.sql](database/migrations/add_certificate_types.sql)

**What it does**:
- Adds `certificate_type` column to `certificates` table
- Adds `gender` column to `vendor_applications` table
- Adds `age` column to `vendor_applications` table
- Sets all existing vendors as 'male' (default)
- Adds necessary indexes and constraints

### 2. Vendor Registration Route
**File**: [src/app/api/vendor-register/route.ts](src/app/api/vendor-register/route.ts)

**Changes**:
- Line 188: Added `gender: data.gender` to `applicationData`
- Line 189: Added `age: parseInt(data.age) || null` to `applicationData`

**Result**: Gender and age now included in registration data sent to database

### 3. Database Create Method
**File**: [src/lib/db.ts](src/lib/db.ts)

**Changes**:
- Line 252: Added `gender, age` to INSERT column list
- Line 253: Added `$23, $24` placeholders
- Line 278-279: Added `application.gender || null` and `application.age || null` to parameters

**Result**: Database now saves gender and age when creating vendor applications

### 4. Additional Files Already Created
- ✅ [src/lib/certificateGenerator.ts](src/lib/certificateGenerator.ts) - Multi-certificate logic
- ✅ [src/components/MultipleCertificatesDownload.tsx](src/components/MultipleCertificatesDownload.tsx) - New UI component
- ✅ [src/app/api/certificates/regenerate/route.ts](src/app/api/certificates/regenerate/route.ts) - Regeneration endpoint
- ✅ Admin dashboard updated with multi-certificate support

## Next Steps (Manual Actions Required)

### Step 1: Run the Database Migration

You need to run the SQL migration file on your database. You have two options:

**Option A: Through pgAdmin or Database Client**
1. Open your database client (pgAdmin, DBeaver, etc.)
2. Connect to your Supabase database
3. Open and execute: `database/migrations/add_certificate_types.sql`

**Option B: Through Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Copy and paste contents of `database/migrations/add_certificate_types.sql`
5. Click "Run"

### Step 2: Regenerate Certificates for Bhopal Vendor

After running migration, regenerate certificates for the existing Bhopal vendor:

**Method 1: Using the Regenerate API (Recommended)**
```bash
POST /api/certificates/regenerate
Body: {
  "applicationId": "APP17685487954474NPXFZ"
}
```

**Method 2: Through Admin Dashboard**
1. Go to Admin Dashboard
2. View Application: APP17685487954474NPXFZ
3. In the certificates section, it will show the certificate
4. The MultipleCertificatesDownload component will auto-fetch/generate

### Step 3: Verify the Fix

**For Existing Bhopal Vendor**:
- Should now show 2 certificates:
  - MP Certificate (CERT-2026-XXXXX)
  - Bhopal Certificate (CERT-2026-XXXXX)

**For New Vendors**:
- Male from Bhopal/Jabalpur/Gwalior/Indore/Mandsour/Rewa/Ujjain → 2 certs (MP + City)
- Female from anywhere → 2 certs (MP + Mahila Ekta)
- Others → 1 cert (MP only)

## What's Fixed Now

### ✅ All Registration Fields Saved
| Field | Status | Saved As |
|-------|--------|----------|
| Name | ✅ Saved | user.full_name |
| Age | ✅ Saved | vendor_applications.age |
| Mobile | ✅ Saved | user.phone, vendor_applications.phone |
| Email | ✅ Saved | user.email, vendor_applications.contact_email |
| Gender | ✅ Saved | vendor_applications.gender |
| ID Type | ✅ Saved | documents.document_type |
| ID Document | ✅ Saved | documents table |
| Photo | ✅ Saved | documents table |
| Shop Name | ✅ Saved | vendor_applications.company_name |
| Business Type | ✅ Saved | vendor_applications.business_type |
| Address Lines | ✅ Saved | vendor_applications.address (combined) |
| Landmark | ✅ Saved | vendor_applications.address (combined) |
| City | ✅ Saved | vendor_applications.city |
| State | ✅ Saved | vendor_applications.state |
| Pincode | ✅ Saved | vendor_applications.postal_code |
| Shop Document Type | ✅ Saved | documents.document_type |
| Shop Document | ✅ Saved | documents table |
| Shop Photo | ✅ Saved | documents table |

### ✅ Certificate Generation Logic
- Female vendors → MP + Mahila Ekta (2 certificates)
- Male from specific cities → MP + City-specific (2 certificates)
- Others → MP only (1 certificate)
- All existing vendors default to 'male'

### ✅ Admin Dashboard
- Shows all certificates for each vendor
- Individual download buttons for each certificate type
- Proper certificate names displayed

### ✅ Vendor Dashboard
- Shows all their certificates
- Individual download buttons
- Track Application link added

## Testing Checklist

After running migration:

- [ ] Check database: Verify `gender` and `age` columns exist in `vendor_applications`
- [ ] Check database: Verify `certificate_type` column exists in `certificates`
- [ ] Check database: Verify existing vendors have `gender = 'male'`
- [ ] Test: Register new male vendor from Bhopal → Should get 2 certs
- [ ] Test: Register new female vendor → Should get 2 certs (MP + Mahila Ekta)
- [ ] Test: Register new male vendor from Delhi → Should get 1 cert (MP only)
- [ ] Test: Download each certificate type → Proper filenames
- [ ] Test: Verify Bhopal vendor (APP17685487954474NPXFZ) now shows 2 certificates

## Important Notes

1. **PDF Templates**: You still need to add these PDF files to the `public` folder:
   - mahila-ekta-template.pdf
   - bhopal-certificate-template.pdf
   - jabalpur-certificate-template.pdf
   - gwalior-certificate-template.pdf
   - indore-certificate-template.pdf
   - mandsour-certificate-template.pdf
   - rewa-certificate-template.pdf
   - ujjain-certificate-template.pdf

2. **Coordinate System**: All templates must use the same coordinates as `id-card-template.pdf`

3. **New Registrations**: All new vendor registrations will automatically save gender and age

4. **Existing Vendors**: All existing vendors are now marked as 'male' by default

## Support

If issues occur:
1. Check database migration ran successfully
2. Verify all PDF templates are in place
3. Check browser console for errors
4. Verify gender and city values in vendor_applications table
