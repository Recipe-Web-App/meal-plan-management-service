import { validate } from 'class-validator';
import {
  SimpleSanitizer,
  StripHtml,
  NormalizeWhitespace,
  SanitizeText,
} from './simple-sanitizer.validator';

class TestStripHtmlDto {
  @StripHtml()
  content!: string;
}

class TestNormalizeWhitespaceDto {
  @NormalizeWhitespace()
  content!: string;
}

class TestSanitizeTextDto {
  @SanitizeText()
  content!: string;
}

describe('SimpleSanitizer', () => {
  describe('stripHtml', () => {
    it('should remove all HTML tags', () => {
      const input = '<p>This is <strong>bold</strong> text</p>';
      const result = SimpleSanitizer.stripHtml(input);
      expect(result).toBe('This is bold text');
    });

    it('should remove dangerous script tags', () => {
      const input = 'Hello <script>alert("xss")</script> world';
      const result = SimpleSanitizer.stripHtml(input);
      expect(result).toBe('Hello alert("xss") world');
    });

    it('should handle empty input', () => {
      expect(SimpleSanitizer.stripHtml('')).toBe('');
      expect(SimpleSanitizer.stripHtml(null as any)).toBe(null);
      expect(SimpleSanitizer.stripHtml(undefined as any)).toBe(undefined);
    });

    it('should handle non-string input', () => {
      expect(SimpleSanitizer.stripHtml(123 as any)).toBe(123);
      expect(SimpleSanitizer.stripHtml({} as any)).toEqual({});
    });

    it('should trim whitespace', () => {
      const input = '  <p>Content</p>  ';
      const result = SimpleSanitizer.stripHtml(input);
      expect(result).toBe('Content');
    });
  });

  describe('normalizeWhitespace', () => {
    it('should collapse multiple spaces', () => {
      const input = 'Hello     World    Test';
      const result = SimpleSanitizer.normalizeWhitespace(input);
      expect(result).toBe('Hello World Test');
    });

    it('should limit consecutive line breaks', () => {
      const input = 'Line 1\n\n\n\n\nLine 2';
      const result = SimpleSanitizer.normalizeWhitespace(input);
      expect(result).toBe('Line 1\n\nLine 2');
    });

    it('should trim whitespace', () => {
      const input = '   Hello World   ';
      const result = SimpleSanitizer.normalizeWhitespace(input);
      expect(result).toBe('Hello World');
    });

    it('should handle empty input', () => {
      expect(SimpleSanitizer.normalizeWhitespace('')).toBe('');
      expect(SimpleSanitizer.normalizeWhitespace(null as any)).toBe(null);
      expect(SimpleSanitizer.normalizeWhitespace(undefined as any)).toBe(undefined);
    });

    it('should handle non-string input', () => {
      expect(SimpleSanitizer.normalizeWhitespace(123 as any)).toBe(123);
      expect(SimpleSanitizer.normalizeWhitespace({} as any)).toEqual({});
    });
  });
});

describe('StripHtml decorator', () => {
  it('should pass validation', async () => {
    const dto = new TestStripHtmlDto();
    dto.content = '<p>Test content</p>';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should handle null values', async () => {
    const dto = new TestStripHtmlDto();
    dto.content = null as any;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

describe('NormalizeWhitespace decorator', () => {
  it('should pass validation', async () => {
    const dto = new TestNormalizeWhitespaceDto();
    dto.content = 'Test   content   with   spaces';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should handle null values', async () => {
    const dto = new TestNormalizeWhitespaceDto();
    dto.content = null as any;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

describe('SanitizeText decorator', () => {
  it('should pass validation', async () => {
    const dto = new TestSanitizeTextDto();
    dto.content = '<p>Test   content   with   HTML</p>';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should handle null values', async () => {
    const dto = new TestSanitizeTextDto();
    dto.content = null as any;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

describe('edge cases', () => {
  it('should handle complex mixed content', () => {
    const input = '  <script>alert("xss")</script>  <p>Safe   content</p>  \n\n\n\n  ';
    const htmlStripped = SimpleSanitizer.stripHtml(input);
    const normalized = SimpleSanitizer.normalizeWhitespace(htmlStripped);

    expect(normalized).toBe('alert("xss") Safe content');
  });

  it('should handle malformed HTML', () => {
    const input = '<p>Unclosed paragraph<div>Nested elements</div>';
    const result = SimpleSanitizer.stripHtml(input);
    expect(result).toBe('Unclosed paragraphNested elements');
  });

  it('should handle only whitespace', () => {
    const input = '   \n\n\n   \t\t\t   ';
    const result = SimpleSanitizer.normalizeWhitespace(input);
    expect(result).toBe('');
  });
});
