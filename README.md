# Habit Tracker

A minimalistic, dark themed habit tracking web app that helps you build consistency. Track daily habits, see your weekly and monthly progress, and stay accountable without creating an account or relying on a backend.

🔗 **Live site:** https://udsau.github.io/Habit-tracker/

## Features

- Add, delete, and reorder habits with drag & drop.
- Weekly check-in grid (Monday-Sunday), with today and yesterday editable.
- Custom weekly goals per habit (e.g. 5x/week for gym, 7x/week for daily habits).
- Monthly analytics: weekly completion breakdown, most consistent/inconsistent habits, and overall monthly score
- Browse past weeks in read-only mode
- All data saved locally in your browser private to you, no account or login needed

## Tech Stack

- React + Vite
- Tailwind CSS
- Recharts (analytics charts)
- @dnd-kit (drag-and-drop reordering)
- localStorage (data persistence)

## Deployment

This project is deployed via GitHub Pages using the `gh-pages` package.

## Notes

This is a personal, local-only habit tracker — each visitor's data lives only in their own browser and is not shared or synced across devices. Account/login and cross-device sync may be added in a future version.
