import { Button } from './ui/button';

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./ui/popover";

import { Textarea } from "./ui/textarea";

import { Search, Highlighter, BookMarked, MessageSquarePlus, Bookmark as BookmarkIcon, Settings } from 'lucide-react'

const Widgets = ({setIsSans, isSans, size, changeSize, toggleBookmark, isBookmarked, location, page}) => {
    return (
        <div className="widgets absolute bottom-12 left-5 z-20 space-y-2">
            {/* <div className="font-settings">
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
            </div> */}
            <div className="bookmark">
                <Button
                    className=''
                    onClick={() => {
                        console.log(location, page)
                        toggleBookmark(location, page)
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
    )
}

export default Widgets;