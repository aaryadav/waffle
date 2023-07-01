import { Rendition } from 'epubjs';

export class Highlight {
    text: string;
    cfiRange: string;
    note: string;
    color: string;
    comment: string;
    constructor(text: string, cfiRange: string, color: string, comment: string) {
        this.text = text;
        this.cfiRange = cfiRange;
        this.note = '';
        this.color = color;
        this.comment = comment;
    }

    addHighlight(rendition: Rendition) {
        rendition.annotations.add(
            'highlight',
            this.cfiRange,
            {},
            undefined,
            'hl',
            { 'fill': this.color, 'fill-opacity': '0.3', 'mix-blend-mode': 'multiply' }
        );
    }

    removeHighlight(rendition: Rendition) {
        rendition.annotations.remove(this.cfiRange, 'highlight');
    }

    updateColor(rendition: Rendition, newColor: string) {
        this.color = newColor;
        this.removeHighlight(rendition);
        this.addHighlight(rendition);
    }
}

export class Bookmark {
    location: string;
    page: string;

    constructor(location: string, page: string) {
        this.location = location;
        this.page = page;
    }
}