import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App.jsx';

describe('landing page',()=>{
  it('introduces the investigation and links to case creation',()=>{
    render(<MemoryRouter><App/></MemoryRouter>);
    expect(screen.getByRole('heading',{name:/every clue tells a story/i})).toBeInTheDocument();
    expect(screen.getByRole('link',{name:/create a mystery/i})).toHaveAttribute('href','/create');
  });
});
