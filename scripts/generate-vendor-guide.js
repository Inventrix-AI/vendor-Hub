const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  HeadingLevel,
  convertInchesToTwip,
} = require("docx");
const fs = require("fs");
const path = require("path");

// Create the document
const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.5),
            bottom: convertInchesToTwip(0.5),
            left: convertInchesToTwip(0.5),
            right: convertInchesToTwip(0.5),
          },
        },
      },
      children: [
        // Main Title
        createTitleBox(
          "पथ विक्रेता एकता संघ पोर्टल का उपयोग करने हेतु त्वरित गाइड",
          "4CAF50"
        ),

        new Paragraph({ spacing: { after: 200 } }),

        // Section 1: Registration
        createSectionHeader("➤ पंजीकरण (Registration) करने हेतु"),

        createBulletPoint("सबसे पहले पथ विक्रेता एकता संघ पोर्टल पर जाएं"),
        createBulletPoint("'नया सदस्य बनें' (Register) बटन पर क्लिक करें"),
        createBulletPoint("अपना पूरा नाम, ईमेल, मोबाइल नंबर और पासवर्ड दर्ज करें"),
        createBulletPoint("फॉर्म भरने के बाद 'रजिस्टर' बटन पर क्लिक करें"),

        new Paragraph({ spacing: { after: 300 } }),

        // Section 2: Vendor Application
        createHighlightBox(
          "➤ वेंडर पंजीकरण आवेदन (4 चरणों में)",
          "2196F3"
        ),

        new Paragraph({ spacing: { after: 100 } }),

        // Step 1
        createStepHeader("चरण 1: व्यक्तिगत जानकारी"),
        createBulletPoint("अपना नाम, आयु (18+ आवश्यक), मोबाइल नंबर दर्ज करें"),
        createBulletPoint("लिंग (Gender) चुनें"),
        createBulletPoint("पहचान दस्तावेज़ प्रकार चुनें (आधार कार्ड, वोटर ID, ड्राइविंग लाइसेंस, पैन कार्ड)"),
        createBulletPoint("पहचान दस्तावेज़ और पासपोर्ट साइज़ फोटो अपलोड करें"),

        new Paragraph({ spacing: { after: 200 } }),

        // Step 2
        createStepHeader("चरण 2: व्यापार विवरण"),
        createBulletPoint("दुकान का नाम दर्ज करें"),
        createBulletPoint("व्यापार प्रकार चुनें (खुदरा विक्रेता, किराना स्टोर, पान दुकान, स्ट्रीट वेंडर, थोक व्यापारी)"),

        new Paragraph({ spacing: { after: 200 } }),

        // Step 3
        createStepHeader("चरण 3: पता और दस्तावेज़"),
        createBulletPoint("पूरा पता दर्ज करें (पता लाइन 1 और 2)"),
        createBulletPoint("लैंडमार्क और पिनकोड दर्ज करें (शहर और राज्य स्वचालित रूप से भर जाएंगे)"),
        createBulletPoint("दुकान दस्तावेज़ प्रकार चुनें (गुमास्ता लाइसेंस, किराया समझौता, अन्य)"),
        createBulletPoint("दुकान के दस्तावेज़ और दुकान की फोटो अपलोड करें"),

        new Paragraph({ spacing: { after: 200 } }),

        // Step 4
        createStepHeader("चरण 4: भुगतान"),
        createBulletPoint("वार्षिक सदस्यता शुल्क ₹151 का भुगतान करें"),
        createBulletPoint("Razorpay के माध्यम से भुगतान करें (UPI, कार्ड, नेट बैंकिंग)"),
        createBulletPoint("भुगतान सफल होने पर Vendor ID और पासवर्ड प्राप्त करें"),

        new Paragraph({ spacing: { after: 300 } }),

        // Important Notes Section
        createWarningBox("ध्यान रखने योग्य बातें"),

        new Paragraph({ spacing: { after: 100 } }),

        createBulletPoint("आयु 18 वर्ष से अधिक होनी चाहिए", true),
        createBulletPoint("मोबाइल नंबर और ईमेल पहले से पंजीकृत नहीं होने चाहिए", true),
        createBulletPoint("फोटो का आकार 2MB से कम और दस्तावेज़ 5MB से कम होना चाहिए", true),
        createBulletPoint("स्वीकृत फॉर्मेट: JPEG, PNG, PDF", true),
        createBulletPoint("भुगतान रसीद और Vendor ID सुरक्षित रखें", true),

        new Paragraph({ spacing: { after: 300 } }),

        // Dashboard Section
        createHighlightBox("➤ डैशबोर्ड पर उपलब्ध सुविधाएं", "9C27B0"),

        new Paragraph({ spacing: { after: 100 } }),

        createBulletPoint("सदस्यता स्थिति देखें (सक्रिय/समाप्त होने वाली/समाप्त)"),
        createBulletPoint("पंजीकरण प्रमाणपत्र डाउनलोड करें (स्वीकृति के बाद)"),
        createBulletPoint("आवेदन की स्थिति ट्रैक करें"),
        createBulletPoint("भुगतान इतिहास देखें"),
        createBulletPoint("प्रोफाइल जानकारी अपडेट करें"),
        createBulletPoint("सदस्यता नवीनीकरण करें"),

        new Paragraph({ spacing: { after: 300 } }),

        // Track Status Section
        createHighlightBox("➤ आवेदन स्थिति ट्रैक करने हेतु", "FF9800"),

        new Paragraph({ spacing: { after: 100 } }),

        createBulletPoint("'आवेदन स्थिति देखें' (Track Status) पर जाएं"),
        createBulletPoint("अपना Application ID दर्ज करें"),
        createBulletPoint("आवेदन की पूरी जानकारी और स्थिति देखें"),

        new Paragraph({ spacing: { after: 300 } }),

        // Certificate Verification Section
        createHighlightBox("➤ प्रमाणपत्र सत्यापन हेतु", "607D8B"),

        new Paragraph({ spacing: { after: 100 } }),

        createBulletPoint("'प्रमाणपत्र सत्यापित करें' (Verify Certificate) पर जाएं"),
        createBulletPoint("प्रमाणपत्र नंबर दर्ज करें"),
        createBulletPoint("प्रमाणपत्र की वैधता और विक्रेता विवरण देखें"),

        new Paragraph({ spacing: { after: 300 } }),

        // Benefits Section
        createTitleBox("सदस्यता के लाभ", "4CAF50"),

        new Paragraph({ spacing: { after: 100 } }),

        createBulletPoint("✓ विशिष्ट Vendor ID प्राप्त करें"),
        createBulletPoint("✓ आधिकारिक पंजीकरण प्रमाणपत्र"),
        createBulletPoint("✓ सरकारी योजनाओं की जानकारी"),
        createBulletPoint("✓ कानूनी सुरक्षा और सहायता"),
        createBulletPoint("✓ ऑनलाइन प्रमाणपत्र सत्यापन"),
        createBulletPoint("✓ ईमेल/SMS के माध्यम से अपडेट"),

        new Paragraph({ spacing: { after: 300 } }),

        // Contact/Help Section
        createWarningBox("सहायता हेतु संपर्क करें"),

        new Paragraph({ spacing: { after: 100 } }),

        new Paragraph({
          children: [
            new TextRun({
              text: "पथ विक्रेता एकता संघ से संपर्क करें या पोर्टल पर 'सहायता' अनुभाग देखें।",
              size: 24,
              font: "Arial",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),

        // Footer
        new Paragraph({
          children: [
            new TextRun({
              text: "© पथ विक्रेता एकता संघ - सभी अधिकार सुरक्षित",
              size: 20,
              font: "Arial",
              color: "666666",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
        }),
      ],
    },
  ],
});

// Helper function to create title box
function createTitleBox(text, color) {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 32,
        font: "Arial",
        color: "FFFFFF",
      }),
    ],
    alignment: AlignmentType.CENTER,
    shading: {
      type: ShadingType.SOLID,
      color: color,
    },
    spacing: { before: 100, after: 100 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 1, color: color },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: color },
      left: { style: BorderStyle.SINGLE, size: 1, color: color },
      right: { style: BorderStyle.SINGLE, size: 1, color: color },
    },
  });
}

// Helper function to create section header
function createSectionHeader(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 28,
        font: "Arial",
        color: "1565C0",
      }),
    ],
    spacing: { before: 200, after: 100 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "1565C0" },
    },
  });
}

// Helper function to create highlight box
function createHighlightBox(text, color) {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 26,
        font: "Arial",
        color: "FFFFFF",
      }),
    ],
    alignment: AlignmentType.CENTER,
    shading: {
      type: ShadingType.SOLID,
      color: color,
    },
    spacing: { before: 100, after: 100 },
  });
}

// Helper function to create warning box
function createWarningBox(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 26,
        font: "Arial",
        color: "C62828",
      }),
    ],
    alignment: AlignmentType.CENTER,
    shading: {
      type: ShadingType.SOLID,
      color: "FFCDD2",
    },
    spacing: { before: 100, after: 100 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 2, color: "C62828" },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "C62828" },
      left: { style: BorderStyle.SINGLE, size: 2, color: "C62828" },
      right: { style: BorderStyle.SINGLE, size: 2, color: "C62828" },
    },
  });
}

// Helper function to create step header
function createStepHeader(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text: "▶ " + text,
        bold: true,
        size: 24,
        font: "Arial",
        color: "2E7D32",
      }),
    ],
    spacing: { before: 100, after: 50 },
  });
}

// Helper function to create bullet point
function createBulletPoint(text, isWarning = false) {
  return new Paragraph({
    children: [
      new TextRun({
        text: "• " + text,
        size: 22,
        font: "Arial",
        color: isWarning ? "D84315" : "333333",
      }),
    ],
    spacing: { before: 50, after: 50 },
    indent: {
      left: convertInchesToTwip(0.3),
    },
  });
}

// Generate and save the document
async function generateDocument() {
  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, "..", "public", "vendor-guide-hindi.docx");
  fs.writeFileSync(outputPath, buffer);
  console.log("Document generated successfully at:", outputPath);
}

generateDocument();
