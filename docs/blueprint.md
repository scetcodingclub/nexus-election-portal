# **App Name**: NEXUS Voting Panel

## Core Features:

- Admin Authentication: Admin login to create and manage election rooms.
- Election Room Management: Creation of election rooms with configurable details like title, description, and room access restrictions.
- Position and Candidate Setup: Configuration of positions (e.g., President, VP) and addition of candidates for each position.
- Access Generation: Generation of shareable room links and QR codes for voter access.
- Voting Interface: Anonymous voting interface for voters with an email prompt, ensuring only one vote per position.
- Results Presentation: Visual display of results using tables and charts (bar and pie), and export the report as a PDF.

## Style Guidelines:

- Primary color: Deep green (#00796B), evoking trustworthiness and importance, consistent with the established green-and-black theme for the Nexus Coding Club.
- Background color: Almost black (#121212), contributing to the modern dark mode aesthetic and maintaining brand identity; allows UI elements to pop.
- Accent color: Off-white (#EEEEEE), used sparingly to highlight interactive elements, and to ensure readability and visual clarity against the dark background.
- Font choice: 'Inter' sans-serif for headings and body text; noted as user's requested font, lending a modern, objective, and highly readable style.
- Note: currently only Google Fonts are supported.
- Flat UI with rounded buttons and card-based layout to create a modern and intuitive experience.
- Subtle transition animations to improve UX, such as vote locking and result loading. Use web animations API (WAAPI) or transition property