'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bot, Check, ExternalLink, Loader2, MapPin, Send, UserRound } from 'lucide-react';
import { isValidUSZip } from '@/services/geocoding';

interface AnswerSection {
  heading: string;
  explanation: string;
  facts: string[];
}

interface StructuredAnswer {
  headline: string;
  summary: string;
  sections: AnswerSection[];
  limitations: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  structuredAnswer?: StructuredAnswer;
}

interface AreaAIChatProps {
  standalone?: boolean;
}

const STARTER_PROMPTS = [
  'What are the biggest recent signals?',
  'How have income and population changed?',
  'Which local place records changed recently?'
];

function AssistantResponse({ answer }: { answer: StructuredAnswer }) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <h3 className="text-sm font-black leading-snug text-white">{answer.headline}</h3>
        <p className="text-xs leading-relaxed text-zinc-300">{answer.summary}</p>
      </div>

      <div className="space-y-3">
        {answer.sections.map(section => (
          <section key={section.heading} className="rounded-lg border border-zinc-800 bg-black/50 p-3">
            <h4 className="mb-1 text-[11px] font-black uppercase tracking-wider text-emerald-300">
              {section.heading}
            </h4>
            <p className="text-xs leading-relaxed text-zinc-300">{section.explanation}</p>
            {section.facts.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {section.facts.map(fact => (
                  <li key={fact} className="flex gap-2 text-[11px] leading-relaxed text-zinc-400">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <aside className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Data limits</p>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">{answer.limitations}</p>
      </aside>
    </div>
  );
}

export function AreaAIChat({ standalone = false }: AreaAIChatProps) {
  const [zip, setZip] = useState('10001');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askQuestion = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanZip = zip.trim();
    const cleanQuestion = question.trim();
    if (!isValidUSZip(cleanZip)) {
      setError('Enter a valid 5-digit US ZIP code.');
      return;
    }
    if (!cleanQuestion || isLoading) return;

    const userMessage: Message = { role: 'user', content: cleanQuestion };
    const nextMessages = [...messages, userMessage].slice(-8);
    setMessages(nextMessages);
    setQuestion('');
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/area-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zip: cleanZip, messages: nextMessages })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'The area assistant is unavailable.');

      const assistantMessage: Message = {
        role: 'assistant',
        content: String(payload.answer),
        structuredAnswer: payload.structuredAnswer
      };
      setMessages(current => [
        ...current,
        assistantMessage
      ].slice(-8));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The area assistant is unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      id="area-ai-chat"
      className={standalone ? 'w-full' : 'border-b border-zinc-800 bg-zinc-950/70 px-4 py-10 sm:px-6'}
    >
      <div className={standalone ? 'w-full' : 'mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center'}>
        {!standalone && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="font-sans text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                Ask what changed.
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-zinc-400">
                Ask about demographic trends and recently edited local place records for any US ZIP code. Answers are grounded in live public data and clearly label uncertainty.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {STARTER_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setQuestion(prompt)}
                  className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-left text-[10px] font-bold text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-zinc-700 bg-black shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900">
                <Bot className="h-4 w-4 text-emerald-400" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-white">Area Intelligence Chat</p>
                <p className="text-[9px] uppercase tracking-wider text-zinc-500">Public-data grounded</p>
              </div>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Evidence-aware</span>
          </div>

          <div className={`${standalone ? 'h-[520px]' : 'h-80'} space-y-3 overflow-y-auto p-4`} aria-live="polite">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <Bot className="mb-3 h-7 w-7 text-zinc-600" />
                <p className="text-sm font-bold text-zinc-300">Choose a ZIP and ask a question.</p>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                  {standalone
                    ? 'Choose a suggested question below or write your own.'
                    : 'Try “What changed around 10001?” or select one of the prompts on the left.'}
                </p>
                {standalone && (
                  <div className="mt-5 flex max-w-lg flex-wrap justify-center gap-2">
                    {STARTER_PROMPTS.map(prompt => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => setQuestion(prompt)}
                        className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-[10px] font-bold text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white active:scale-[0.98]"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400">
                    <Bot className="h-3.5 w-3.5" />
                  </span>
                )}
                <div className={`${message.role === 'assistant' ? 'max-w-[95%]' : 'max-w-[85%]'} rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-white text-black'
                    : 'border border-zinc-800 bg-zinc-950 text-zinc-300'
                }`}>
                  {message.role === 'assistant' && message.structuredAnswer
                    ? <AssistantResponse answer={message.structuredAnswer} />
                    : <span className="whitespace-pre-wrap">{message.content}</span>}
                </div>
                {message.role === 'user' && (
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-zinc-300">
                    <UserRound className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                Scanning public area records…
              </div>
            )}
          </div>

          <form onSubmit={askQuestion} className="border-t border-zinc-800 p-3">
            {error && <p className="mb-2 text-[11px] text-rose-400">{error}</p>}
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative shrink-0 sm:w-28">
                <span className="sr-only">US ZIP code</span>
                <MapPin className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                <input
                  value={zip}
                  onChange={event => setZip(event.target.value.replace(/\D/g, '').slice(0, 5))}
                  inputMode="numeric"
                  maxLength={5}
                  aria-label="US ZIP code"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3 pl-8 pr-2 text-xs font-bold text-white outline-none transition-colors focus:border-zinc-500"
                />
              </label>
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Ask about changes in this area</span>
                <input
                  value={question}
                  onChange={event => setQuestion(event.target.value)}
                  maxLength={800}
                  placeholder="What changed in this area?"
                  aria-label="Ask about changes in this area"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3 pl-3 pr-12 text-xs text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-500"
                />
                <button
                  type="submit"
                  disabled={isLoading || !question.trim()}
                  aria-label="Send question"
                  className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-white text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </button>
              </label>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[9px] text-zinc-600">
              <span>Map-record edits can differ from physical-world change dates.</span>
              <Link href={`/area/${isValidUSZip(zip) ? zip : '10001'}`} className="flex shrink-0 items-center gap-1 text-zinc-500 hover:text-white">
                Full report <ExternalLink className="h-2.5 w-2.5" />
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
