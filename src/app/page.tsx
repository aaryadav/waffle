'use client';

import React, { useState, useEffect, useRef } from 'react'
import { ReactReader } from 'react-reader'
import { Search, Highlighter, BookMarked, MessageSquarePlus, Bookmark as BookmarkIcon, Settings, Trash, ArrowUpLeft } from 'lucide-react';

import { IReactReaderProps, IToc } from 'react-reader';
import { Contents, Rendition } from 'epubjs';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";

import { Textarea } from "../../components/ui/textarea";
import { Button } from '../../components/ui/button';

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


class Bookmark {
  location: string;
  page: string;

  constructor(location: string, page: string) {
    this.location = location;
    this.page = page;
  }
}

export default function Home() {

  const [size, setSize] = useState<number>(100)
  const [location, setLocation] = useState<string | undefined>(undefined)
  const [firstRenderDone, setFirstRenderDone] = useState<boolean>(false);
  const readerContainerRef = useRef<HTMLDivElement | null>(null);

  const [isSans, setIsSans] = useState<boolean>(true);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  const [selectedCfiRange, setSelectedCfiRange] = useState<string | null>(null);
  const [color, setColor] = useState<string>('#f59e0b');
  const [isHighlighted, setIsHighlighted] = useState<boolean>(false);
  const [noteInput, setNoteInput] = useState<string>('');
  const [hasNote, setHasNote] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const [page, setPage] = useState('')
  const tocRef = useRef<IToc[]>([]);

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

  const addBookmark = (location: string | undefined, page: string) => {
    if (location) {
      console.log(page);
      const newBookmark = new Bookmark(location, page);
      setBookmarks([...bookmarks, newBookmark]);
    }
  }

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
        `Page ${page} of ${total} in chapter ${chapter ? chapter.label : 'n/a'
        }`
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
    <>
      <div className="nav border-b p-5">
        Waffle
      </div>
      <div className="h-screen float-left w-3/4">
        <div className="reader h-screen border-r" ref={readerContainerRef}>
          <ReactReader
            location={location}
            locationChanged={locationChanged}
            url="https://react-reader.metabits.no/files/alice.epub"
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
          <div className="widgets absolute bottom-12 left-5 z-20 space-y-2">
            <div className="font-settings">
              <Popover>
                <PopoverTrigger>
                  <Button
                    variant="outline"
                  >
                    <Settings className='w-4 h-4' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="z-20 w-fit">
                  <div className="space-y-2 ">
                    <div className="font-fam flex space-x-2">
                      <button
                        onClick={() => { setIsSans(true) }}
                        className={`font-sans hover:bg-gray-300 py-2 px-3 rounded ${isSans ? "bg-gray-300" : ""}`}>
                        Aa
                      </button>
                      <button
                        onClick={() => { setIsSans(false) }}
                        className={`font-serif hover:bg-gray-300 py-2 px-3 rounded ${!isSans ? "bg-gray-300" : ""}`}>
                        Aa
                      </button>
                    </div>
                    <div className="font-size flex items-center space-x-2">
                      <Button
                        variant='outline'
                        onClick={() => changeSize(Math.max(80, size - 10))}>
                        -
                      </Button>
                      <span className='p-2 border rounded'>{size}%</span>
                      <Button
                        variant='outline'
                        onClick={() => changeSize(Math.min(130, size + 10))}>
                        +
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="bookmark">
              <Button
                className=''
                onClick={() => {
                  addBookmark(location, page)
                  setIsBookmarked(true)
                }}
              >
                {!isBookmarked ? (
                  <BookmarkIcon className='w-4 h-4' />
                ) : (
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 2C3.22386 2 3 2.22386 3 2.5V13.5C3 13.6818 3.09864 13.8492 3.25762 13.9373C3.41659 14.0254 3.61087 14.0203 3.765 13.924L7.5 11.5896L11.235 13.924C11.3891 14.0203 11.5834 14.0254 11.7424 13.9373C11.9014 13.8492 12 13.6818 12 13.5V2.5C12 2.22386 11.7761 2 11.5 2H3.5Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
                )}
              </Button>

            </div>
          </div>
        </div>
      </div>
      <div className="sidebar float-right w-1/4 h-screen">
        <Tabs defaultValue="chat" className="">
          <TabsList className='w-full flex justify-around'>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
            <TabsTrigger value="highlights">Highlights</TabsTrigger>
          </TabsList>
          <TabsContent value="chat">
            <div className="chat p-5">
              Hey!
            </div>
          </TabsContent>
          <TabsContent value="bookmarks">
            <div className="bookmarks p-8">
              {bookmarks.length > 0 ? (
                <ul className="space-y-4">
                  {bookmarks.map((bookmark: Bookmark, i: number) => (
                    <li key={i}>
                      <button
                        className='hover:underline decoration-2 text-left'
                        onClick={() => {
                          renditionRef.current?.display(bookmark.location)
                        }}
                      >
                        {bookmark.page}
                      </button>
                    </li>
                  ))}
                </ul>) : (
                <div className="text-gray-500">
                  Your bookmarks will appear here.
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="highlights">
            <div className="selections-list p-8">
              {selections.length > 0 ? (
                <ul className='space-y-4'>
                  {selections.map((highlight: Highlight, i: number) => (
                    <li key={i}>
                      <span>{highlight.text}</span>
                      <span>{highlight.note}</span>
                      <div className='options space-x-2'>
                        <Button
                          className='rounded-full'
                          variant='secondary'
                          onClick={() => {
                            renditionRef.current?.display(highlight.cfiRange);
                          }}
                        >
                          <ArrowUpLeft className='w-4' />
                        </Button>
                        <Button
                          className='rounded-full'
                          variant='secondary'
                          onClick={() => {
                            renditionRef.current?.annotations.remove(highlight.cfiRange, 'highlight');
                            setSelections(selections.filter((item, j) => j !== i));
                          }}
                        >
                          <Trash className='w-4' />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-500">
                  Your highlights will appear here.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

      </div>
      {
        contextMenu.visible && (
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
        )
      }
    </>
  )
}