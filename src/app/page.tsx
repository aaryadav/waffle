'use client';

import React, { useState, useEffect, useRef } from 'react'
import { Trash, ArrowUpLeft } from 'lucide-react';

import { Contents, Rendition } from 'epubjs';

import { Highlight, Bookmark } from './classes';

import NavBar from "../../components/NavBar";
import Reader from "../../components/Reader";
import Sidebar from "../../components/Sidebar";

export default function Home() {

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [selections, setSelections] = useState<Highlight[]>([]);
  const renditionRef = useRef<Rendition | null>(null);

  return (
    <>
      <NavBar />
      <div className="h-screen float-left w-3/4">
        <Reader bookmarks={bookmarks} setBookmarks={setBookmarks} selections={selections} setSelections={setSelections} renditionRef={renditionRef} />
      </div>
      <Sidebar bookmarks={bookmarks} setBookmarks={setBookmarks} selections={selections} setSelections={setSelections} renditionRef={renditionRef} />
    </>
  )
}