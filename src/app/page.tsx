'use client';

import React, { useState, useEffect, useRef } from 'react'
import { ReactReader } from 'react-reader'
import { Search, Highlighter, BookMarked, MessageSquarePlus } from 'lucide-react'

import { IReactReaderProps } from 'react-reader';
import { Contents, Rendition } from 'epubjs';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover"

import { Textarea } from "../../components/ui/textarea"

class Highlight {
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

export default function Home() {

  const [size, setSize] = useState<number>(100)
  const [location, setLocation] = useState<string | number | undefined>(undefined)
  const [firstRenderDone, setFirstRenderDone] = useState<boolean>(false);
  const readerContainerRef = useRef<HTMLDivElement | null>(null);

  const [selectedCfiRange, setSelectedCfiRange] = useState<string | null>(null);
  const [color, setColor] = useState<string>('#f59e0b');
  const [isHighlighted, setIsHighlighted] = useState<boolean>(false);
  const [noteInput, setNoteInput] = useState<string>('');
  const [hasNote, setHasNote] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  const [selections, setSelections] = useState<Highlight[]>([]);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number }>({ visible: false, x: 0, y: 0 });

  const renditionRef = useRef<Rendition | null>(null);

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
    const width = readerContainerRef.current?.offsetWidth ?? 0;
    const newX = rect.left > width ? rect.left - width : rect.left
    setContextMenu({
      visible: true,
      x: newX + newX / 2,
      y: rect.top + 50,
    });

    const highlighted = selections.some((selection) => selection.cfiRange === cfiRange);
    setIsHighlighted(highlighted);
    const hasNote = selections.some((selection) => selection.cfiRange === cfiRange && selection.note !== '');
    setHasNote(hasNote);

    renditionRef.current?.on('mousedown', () => {
      setContextMenu({ visible: false, x: 0, y: 0 });
    });
  }

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

  const locationChanged = (epubcifi: string): void => {
    if (!firstRenderDone) {
      setLocation(localStorage.getItem('book-progress') ?? undefined)
      setFirstRenderDone(true)
      return
    }

    localStorage.setItem('book-progress', epubcifi)
    setLocation(epubcifi)
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

      return () => {
        renditionRef.current?.off('selected', setRenderSelection)
      }
    }

  }, [size, setSelections, selections])


  return (
    <>
      <div className="nav border-b p-5">
        Waffle
      </div>
      <div className="h-screen">
        <div className="reader h-5/6 w-3/4 border-r" ref={readerContainerRef}>
          <ReactReader
            location={location}
            locationChanged={locationChanged}
            url="https://react-reader.metabits.no/files/alice.epub"
            getRendition={(rendition) => {
              renditionRef.current = rendition
              rendition.themes.register('custom', {
                "*": {
                  'font-family': 'Inter, sans-serif',
                },
              })
              rendition.themes.select('custom')
              renditionRef.current = rendition;
              renditionRef.current.themes.default({
                '::selection': {
                  background: '#d9f2fd'
                }
              })
              setSelections([])
            }}
          />
          <div className="display-settings w-full border-t p-4 absolute">
            <button onClick={() => changeSize(Math.max(80, size - 10))}> - </button>
            <span>Current size: {size}%</span>
            <button onClick={() => changeSize(Math.min(130, size + 10))}> + </button>
          </div>
        </div>
      </div>
      <div
        className="selections-list absolute bottom-4 right-4 z-10 bg-white"
      >
        Selection:
        <ul>
          {selections.map((highlight: Highlight, i: number) => (
            <li key={i}>
              <span>{highlight.text}</span>
              <span>{highlight.note}</span>
              <button
                onClick={() => {
                  renditionRef.current?.display(highlight.cfiRange)
                }}
              >
                Show
              </button>
              <button
                onClick={() => {
                  renditionRef.current?.annotations.remove(highlight.cfiRange, 'highlight');
                  setSelections(selections.filter((item, j) => j !== i))
                }}
              >
                x
              </button>
            </li>
          ))}
        </ul>
      </div>
      {contextMenu.visible && (
        <div className='context-menu border z-10 absolute absolute bg-white rounded-xl p-2 shadow-lg z-10'
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div className="hl flex space-x-6 m-2">
            <button
              className={`bg-amber-500 w-5 h-5 rounded-full ${color === '#f59e0b' ? 'ring-2 ring-offset-2 ring-offset-white ring-amber-400' : ''}`}
              onClick={() => { updateHighlightColor('#f59e0b') }}
            />
            <button
              className={`bg-violet-500 w-5 h-5 rounded-full ${color === '#8b5cf6' ? 'ring-2 ring-offset-2 ring-offset-white ring-violet-400' : ''}`}
              onClick={() => { updateHighlightColor('#8b5cf6') }}
            />
            <button
              className={`bg-sky-500 w-5 h-5 rounded-full ${color === '#0ea5e9' ? 'ring-2 ring-offset-2 ring-offset-white ring-sky-400' : ''}`}
              onClick={() => { updateHighlightColor('#0ea5e9') }}
            />
            <button
              className={`bg-lime-500 w-5 h-5 rounded-full ${color === '#84cc16' ? 'ring-2 ring-offset-2 ring-offset-white ring-lime-400' : ''}`}
              onClick={() => { updateHighlightColor('#84cc16') }}
            />
          </div>
          <div className="options space-x-1">
            <button
              className='hover:bg-gray-300 p-2 rounded'
            >
              <BookMarked />
            </button>
            <button
              className='hover:bg-gray-300 p-2 rounded'
            >
              <Search />
            </button>
            <button
              className={`hover:bg-gray-300 p-2 rounded ${isHighlighted ? "bg-gray-300" : ""}`}
              onClick={() => {
                handleToggleHighlight(selectedCfiRange ?? "", color)
              }}
            >
              <Highlighter />
            </button>
            <Popover>
              <PopoverTrigger className={`hover:bg-gray-300 p-2 rounded ${hasNote ? "bg-gray-300" : ""}`}>
                <MessageSquarePlus />
              </PopoverTrigger>
              <PopoverContent
                className='bg-white p-2 mt-2 rounded-xl shadow-lg z-10'
              >
                <Textarea
                  className='w-full h-52 border-transparent p-2 rounded focus:outline-none'
                  placeholder="Type your note here."
                  value={noteInput}
                  onChange={handleNoteInput}
                  onKeyDown={handleNoteInput}
                >
                </Textarea>
              </PopoverContent>
            </Popover>

          </div>
        </div>
      )}
    </>
  )
}