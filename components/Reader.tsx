import { useState, useEffect, useRef } from 'react';

import { ReactReader } from 'react-reader'

import { IReactReaderProps, IToc } from 'react-reader';
import { Contents, Rendition } from 'epubjs';
import getSelectedText from 'epubjs';


import { Highlight, Bookmark } from '../src/app/classes';

import Widgets from './Widgets';

import { Button } from './ui/button';

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./ui/popover";

import { Textarea } from "./ui/textarea";

import { Search, Highlighter, BookMarked, MessageSquarePlus, Bookmark as BookmarkIcon, Settings } from 'lucide-react'
import ContextMenu from './ContextMenu';

{/* <Reader bookmarks={bookmarks} setBookmarks={setBookmarks} selections={selections} setSelections={setSelections} renditionRef={renditionRef} /> */ }
const Reader = ({ bookmarks, setBookmarks, selections, setSelections, renditionRef }) => {
    const [size, setSize] = useState<number>(100);
    const [location, setLocation] = useState<string | undefined>(undefined);
    const [firstRenderDone, setFirstRenderDone] = useState<boolean>(false);
    const readerContainerRef = useRef<HTMLDivElement | null>(null);

    const [isSans, setIsSans] = useState<boolean>(true);
    const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

    const [selectedCfiRange, setSelectedCfiRange] = useState<string | null>(null);
    const [word, setWord] = useState('');


    const [color, setColor] = useState<string>('#f59e0b');
    const [isHighlighted, setIsHighlighted] = useState<boolean>(false);
    const [noteInput, setNoteInput] = useState<string>('');
    const [hasNote, setHasNote] = useState<boolean>(false);

    const [page, setPage] = useState('');
    const tocRef = useRef<IToc[]>([]);

    const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number }>({ visible: false, x: 0, y: 0 });


    const changeSize = (newSize: number): void => {
        setSize(newSize)
    }

    const handleToggleHighlight = (cfiRange: string | null, color: string, callback?: (newSelections: Highlight[]) => void) => {
        if (!cfiRange) return;

        const highlightIndex = selections.findIndex((selection) => selection.cfiRange === cfiRange);

        if (highlightIndex !== -1) {
            selections[highlightIndex].removeHighlight(renditionRef.current!);
            setSelections(selections.filter((item) => item.cfiRange !== cfiRange));
            setContextMenu({ visible: false, x: 0, y: 0 });
        } else {
            const range = renditionRef.current?.getRange(cfiRange);
            if (range) {
                const newHighlight = new Highlight(range.toString(), cfiRange, color, '');
                newHighlight.addHighlight(renditionRef.current!);
                const newSelections = selections.concat(newHighlight);
                setSelections(newSelections);
                callback?.(newSelections);
                ((renditionRef.current?.getContents() as unknown) as Contents[]).forEach((content) => {
                    content.window.getSelection()?.removeAllRanges();
                });

            }
        }
        setIsHighlighted(highlightIndex === -1);
    };

    const updateHighlightColor = (newColor: string) => {
        setColor(newColor);
        if (selectedCfiRange) {
            const highlightIndex = selections.findIndex((selection) => selection.cfiRange === selectedCfiRange);
            if (highlightIndex !== -1) {
                selections[highlightIndex].updateColor(renditionRef.current!, newColor);
            }
        }
    };

    const handleContextMenu = (rect: DOMRect, cfiRange: string): void => {
        setSelectedCfiRange(cfiRange);
        const readerWidth = readerContainerRef.current?.offsetWidth ?? 0;
        const readerHeight = readerContainerRef.current?.offsetHeight ?? 0;
        const menuWidth = 200;
        const menuHeight = 180;

        let newX = rect.left;
        let newY = rect.top;


        if (rect.left + menuWidth > readerWidth) {
            newX = readerWidth - menuWidth - (readerWidth / 2.5);
        }

        if (rect.top + menuHeight > readerHeight) {
            newY = readerHeight - menuHeight;
        }

        setContextMenu({
            visible: true,
            x: newX,
            y: newY,
        });

        const highlighted = selections.some((selection) => selection.cfiRange === cfiRange);
        setIsHighlighted(highlighted);

        const hasNote = selections.some((selection) => selection.cfiRange === cfiRange && selection.note !== '');
        setHasNote(hasNote);

        renditionRef.current?.on('mousedown', () => {
            setContextMenu({ visible: false, x: 0, y: 0 });
        });

        const range = renditionRef.current?.getRange(cfiRange);
        setWord(range.toString())
    };

    const handleNoteInput = (event: React.ChangeEvent<HTMLTextAreaElement> & React.KeyboardEvent<HTMLTextAreaElement>) => {
        const isEnterKeyPressed = event.key === 'Enter';
        const isShiftEnterKeyPressed = event.key === 'Enter' && event.shiftKey;
        const isCfiRangeSelected = selectedCfiRange !== null;

        setNoteInput(event.target.value);

        if (isEnterKeyPressed && isCfiRangeSelected && !isShiftEnterKeyPressed) {
            event.preventDefault();

            const highlightIndex = selections.findIndex((selection) => selection.cfiRange === selectedCfiRange);

            if (highlightIndex !== -1) {
                selections[highlightIndex].note = noteInput;
            } else {
                handleToggleHighlight(selectedCfiRange, color, (newSelections) => {
                    const newHighlightIndex = newSelections.findIndex((selection) => selection.cfiRange === selectedCfiRange);

                    if (newHighlightIndex !== -1) {
                        newSelections[newHighlightIndex].note = noteInput;
                    } else {
                        console.error('New highlight not found in selections');
                    }
                });
            }
            setContextMenu({ visible: false, x: 0, y: 0 });
            setHasNote(true);
            // addNoteSticker(selectedCfiRange, noteInput);
        }
    };

    const addNoteSticker = () => {

    };

    const toggleBookmark = (location: string | undefined, page: string) => {
        if (isBookmarked) {
            // remove bookmark from bookmarks without using external function
            const newBookmarks = bookmarks.filter((bookmark: Bookmark) => bookmark.location !== location);
            setBookmarks(newBookmarks);
            setIsBookmarked(false);
        } else {
            if (location) {
                const newBookmark = new Bookmark(location, page);
                setBookmarks([...bookmarks, newBookmark]);
                setIsBookmarked(true);
            }
        }
    };

    const locationChanged = (epubcifi: string): void => {
        if (!firstRenderDone) {
            setLocation(localStorage.getItem('book-progress') ?? undefined)
            setFirstRenderDone(true)
            return
        }

        if (renditionRef.current && tocRef.current) {
            const { displayed, href } = renditionRef.current.location.start
            const chapter = tocRef.current.find(item => item.href === href)
            const page = displayed.page
            const total = displayed.total
            setPage(
                `Page ${page} of ${total}${chapter ? ` in chapter ${chapter.label}` : ''}`
            )
        }

        localStorage.setItem('book-progress', epubcifi)
        setLocation(epubcifi)

        const bookmarkExists = bookmarks.some((bookmark) => bookmark.location === epubcifi);
        setIsBookmarked(bookmarkExists);
    }

    useEffect(() => {
        if (renditionRef.current) {
            renditionRef.current.themes.fontSize(`${size}%`)

            const setRenderSelection = (cfiRange: string, contents: Contents) => {
                const selection = contents.window.getSelection();
                if (selection) {
                    const range = selection.getRangeAt(0);
                    const rect = range.getBoundingClientRect();
                    handleContextMenu(rect, cfiRange);
                }
            }
            renditionRef.current.on('selected', setRenderSelection)
            renditionRef.current.on('markClicked', (cfiRange: string) => {
                const range = renditionRef.current?.getRange(cfiRange);
                const rect = range?.getBoundingClientRect();
                handleContextMenu(rect!, cfiRange);
            })

            if (isSans) {
                renditionRef.current.themes.register('custom', {
                    "*": {
                        // inter or fallback sans-serif
                        'font-family': 'Inter, sans-serif',
                    },
                })
                renditionRef.current.themes.select('custom')
            } else {
                renditionRef.current.themes.register('custom', {
                    "*": {
                        'font-family': 'Lora, serif',
                    },
                })
                renditionRef.current.themes.select('custom')
            }

            return () => {
                renditionRef.current?.off('selected', setRenderSelection)
            }
        }
    }, [size, setSelections, selections, isSans, bookmarks])

    return (
        <div className="reader h-screen border-r" ref={readerContainerRef}>
            <ReactReader
                location={location}
                locationChanged={locationChanged}
                url="https://cloudflare-ipfs.com/ipfs/bafykbzaceaacdleb4kv7sfrjluz2ighyajlwur3i5ydxnfqmf5c2zplbzhyi2?filename=Paul%20Graham%20-%20Hackers%20and%20Painters_%20Big%20Ideas%20from%20the%20Computer%20Age-O%27Reilly%20Media%20%282004%29.epub"
                getRendition={(rendition) => {
                    renditionRef.current = rendition
                    renditionRef.current = rendition;
                    renditionRef.current.themes.default({
                        '::selection': {
                            background: '#d9f2fd'
                        }
                    })
                    setSelections([])
                }}
                tocChanged={toc => (tocRef.current = toc)}
            />
            <Widgets setIsSans={setIsSans} isSans={isSans} size={size} changeSize={changeSize} toggleBookmark={toggleBookmark} isBookmarked={isBookmarked} location={location} page={page} />
            {
                contextMenu.visible && (
                    <ContextMenu
                        contextMenu={contextMenu}
                        word={word}
                        selectedCfiRange={selectedCfiRange}
                        color={color}
                        updateHighlightColor={updateHighlightColor}
                        handleToggleHighlight={handleToggleHighlight}
                        isHighlighted={isHighlighted}
                        hasNote={hasNote}
                        noteInput={noteInput}
                        handleNoteInput={handleNoteInput}
                    />
                )
            }
        </div>
    )
}

export default Reader