import { Bookmark, Highlight } from "../src/app/classes"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Button } from "./ui/button"
import { Trash, ArrowUpLeft } from 'lucide-react';

const Sidebar = ({ bookmarks, setBookmarks, selections, setSelections, renditionRef }: any) => {
    return (
        <>
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
        </>
    )
}

export default Sidebar
