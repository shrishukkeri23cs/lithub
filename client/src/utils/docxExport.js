import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Strips basic markdown for plain text runs
 */
const cleanText = (text) => text.replace(/\*\*/g, '').replace(/\[Document \d+\]/g, (match) => match);

/**
 * Converts Lithub AI Markdown to a formatted DOCX blob
 * Handles: # title, ## heading, - list, **bold**
 */
export const exportToDocx = async (markdown, title = "LitHub AI Research Review") => {
  const lines = markdown.split('\n');
  const children = [];

  // Add LitHub Header
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "LITHUB | SYSTEMATIC AI RESEARCH REVIEW",
          bold: true,
          size: 20,
          color: "1d4ed8",
        }),
      ],
      spacing: { after: 400 },
    })
  );

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Heading 1
    if (trimmed.startsWith('# ')) {
      children.push(
        new Paragraph({
          text: trimmed.replace('# ', ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );
    } 
    // Heading 2
    else if (trimmed.startsWith('## ')) {
      children.push(
        new Paragraph({
          text: trimmed.replace('## ', ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
          border: { bottom: { color: "1d4ed8", space: 1, value: "single", size: 6 } }
        })
      );
    }
    // Heading 3
    else if (trimmed.startsWith('### ')) {
      children.push(
        new Paragraph({
          text: trimmed.replace('### ', ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );
    }
    // Bullet Points
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.substring(2);
      children.push(
        new Paragraph({
          children: processInlineFormatting(content),
          bullet: { level: 0 },
          spacing: { after: 120 },
        })
      );
    }
    // Standard Paragraph
    else {
      children.push(
        new Paragraph({
          children: processInlineFormatting(trimmed),
          spacing: { after: 200 },
        })
      );
    }
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title.replace(/\s+/g, '_')}_${new Date().toLocaleDateString()}.docx`);
};

/**
 * Processes **bold** formatting within a line
 */
function processInlineFormatting(text) {
  const parts = text.split(/(\*\*.*?\*\*)/);
  return parts.map(part => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return new TextRun({
        text: part.slice(2, -2),
        bold: true,
      });
    }
    return new TextRun(part);
  });
}
