# Multiple Certificate System Setup Guide

## Overview
The system has been updated to support multiple certificates based on vendor gender and location. The implementation is complete and ready to use once you add the PDF templates.

## Certificate Logic

### For Female Vendors
- **MP Certificate** (Common for all)
- **Mahila Ekta Certificate** (Female-specific)
- **No location-specific certificates**

### For Male Vendors
- **MP Certificate** (Common for all)
- **Location-specific certificate** (only for vendors from: Bhopal, Jabalpur, Gwalior, Indore, Mandsour, Rewa, Ujjain)

### For Other Vendors
- **MP Certificate** only (if not female and not from the specified cities)

## Required PDF Templates

You need to add the following PDF template files to the `public` folder:

### 1. MP Certificate (Already exists)
- **Filename**: `id-card-template.pdf`
- **Status**: ✅ Already exists
- **Used for**: All vendors

### 2. Mahila Ekta Certificate (NEW - Required)
- **Filename**: `mahila-ekta-template.pdf`
- **Location**: `public/mahila-ekta-template.pdf`
- **Used for**: Female vendors only

### 3. City-specific Certificates (NEW - Required)

You need to add these PDF files to the `public` folder:

1. **Bhopal Certificate**
   - Filename: `bhopal-certificate-template.pdf`

2. **Jabalpur Certificate**
   - Filename: `jabalpur-certificate-template.pdf`

3. **Gwalior Certificate**
   - Filename: `gwalior-certificate-template.pdf`

4. **Indore Certificate**
   - Filename: `indore-certificate-template.pdf`

5. **Mandsour Certificate**
   - Filename: `mandsour-certificate-template.pdf`

6. **Rewa Certificate**
   - Filename: `rewa-certificate-template.pdf`

7. **Ujjain Certificate**
   - Filename: `ujjain-certificate-template.pdf`

## Template Coordinate System

All templates use the **same coordinates** as the current MP certificate:

```typescript
FIELD_POSITIONS = {
  photo: { x: 87, y: 91, width: 154, height: 190 },
  name: { x: 426, y: 276 },
  occupation: { x: 426, y: 232 },
  outletName: { x: 426, y: 192 },
  address: { x: 426, y: 156 },
  idNumber: { x: 426, y: 103 },
  date: { x: 426, y: 60 },
  validity: { x: 674, y: 60 }
}
```

**Important**: Design your PDF templates with fields at these exact coordinates for proper data placement.

## Database Migration

Run the database migration to add certificate type support:

```bash
# The migration file is already created at:
# database/migrations/add_certificate_types.sql
```

This migration:
- Adds `certificate_type` column to `certificates` table
- Adds `gender` column to `vendor_applications` table
- Updates constraints to allow multiple certificates per vendor

## How to Add Templates

1. Save each PDF template file with the exact filename shown above
2. Place all PDF files in the `public` folder
3. Ensure templates have fields at the coordinates specified above
4. Test by creating a vendor application with:
   - Female gender → Should get 2 certificates (MP + Mahila Ekta)
   - Male from Bhopal → Should get 2 certificates (MP + Bhopal)
   - Male from other city → Should get 1 certificate (MP only)

## Testing Checklist

- [ ] Add all 8 PDF template files to `public` folder
- [ ] Run database migration
- [ ] Test female vendor registration → 2 certificates
- [ ] Test male vendor from Bhopal → 2 certificates
- [ ] Test male vendor from Delhi → 1 certificate
- [ ] Test certificate download for each type
- [ ] Test certificate verification for all types
- [ ] Check vendor dashboard shows all certificates

## Features Implemented

✅ Multiple certificate generation based on gender and city
✅ Certificate type-specific PDF templates
✅ Database schema updates with migrations
✅ Certificate generation API supporting multiple certificates
✅ Certificate download API with proper filenames
✅ Certificate verification API showing certificate types
✅ New MultipleCertificatesDownload component
✅ Updated vendor dashboard with:
  - Multiple certificate display
  - Individual download buttons
  - Track Application link
✅ Support for same coordinate system across all templates

## API Endpoints

### Generate Certificates
```
POST /api/certificates/generate
Body: { applicationId: "APP-123" }
Response: { certificates: [...], message: "X certificate(s) generated" }
```

### Download Certificate
```
GET /api/certificates/{certificateId}
Response: PDF file with appropriate filename
```

### Verify Certificate
```
GET /api/certificates/verify/{certificateNumber}
Response: { valid: true, certificate: {..., certificate_type: "mp"} }
```

## Next Steps

1. **Add PDF Templates**: Place all 8 PDF files in the `public` folder with exact filenames
2. **Run Migration**: Apply the database migration
3. **Test**: Create test applications to verify all certificate types work
4. **Deploy**: Deploy to production once testing is complete

## Support

If you encounter any issues:
1. Check that PDF templates have the correct filenames
2. Verify templates use the same coordinate system
3. Ensure database migration has been applied
4. Check browser console for any errors
5. Verify gender and city values in vendor applications are correct
