import React from 'react';
import { ArcadeLink } from '../components/arcade/ArcadeLink';

export function NotFound() {
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center" aria-labelledby="nf-title">
      <h1 id="nf-title" className="cw-logo font-pixel text-2xl">GAME OVER</h1>
      <p className="mt-5 text-muted">This page doesn’t exist. Head back to the start line.</p>
      <ArcadeLink to="/" variant="start" size="md" className="mt-8">
        Continue
      </ArcadeLink>
    </section>);

}