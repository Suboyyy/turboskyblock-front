'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Navbar, Nav, Container } from 'react-bootstrap';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container fluid>
        <Navbar.Brand as={Link} href="/">
          ⛏️ Hypixel Craft Tracker
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              href="/" 
              active={pathname === '/'}
            >
              Dashboard
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              href="/recipes" 
              active={pathname === '/recipes'}
            >
              Recettes
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              href="/projects/new" 
              active={pathname === '/projects/new'}
            >
              Nouveau Projet
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}