import { Button } from './ui/button';

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./ui/popover";

import { Textarea } from "./ui/textarea";

import { Search, Highlighter, BookMarked, MessageSquarePlus, Bookmark as BookmarkIcon, Settings } from 'lucide-react'

const ContextMenu = ({ contextMenu, selectedCfiRange, color, updateHighlightColor, handleToggleHighlight, isHighlighted, hasNote, noteInput, handleNoteInput }) => {
    return (
        <>
            <div className='context-menu border z-10 absolute absolute bg-white rounded-xl p-2 shadow-lg z-10'
                style={{ top: contextMenu?.y, left: contextMenu?.x }}
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
            </div></>
    )
}

export default ContextMenu
