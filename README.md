# Xarajatlar & Oyliklar - Expense & Salary Tracking System

A full-stack expense tracking and salary management application built with **Vite + React + TypeScript** (Tailwind CSS) on the frontend, and **Node.js + Express + Prisma (Neon PostgreSQL)** on the backend, featuring **Firebase Storage** receipt file uploads and Vercel serverless deployment.

## Features
- **Xarajat Kiritish**: Expense entry portal with live 3-digit space-separated UZS currency input, client-side image compression, and Firebase Storage receipt upload.
- **Xarajat Tahlili**: Interactive Line graphs, Bar graphs, and Pie charts with 7-day, 30-day (default), 365-day time pills and branch filter tabs (Hammasi, Vodnik, Suvmash).
- **Xarajat Daftari (Ledger)**: Comprehensive financial ledger tracking expense clerk creators (`createdBy`) and inline Receipt Image Viewer modal.
- **Oyliklar Vedomosti**: Monthly payroll calculations with base salary, shift coverages, and advance deductions.
- **Xodimlar Shtati & Smena Almashtirish**: Staff directory and one-time shift trade tracking.

## Technology Stack
- **Frontend**: Vite, React 18, TypeScript, Tailwind CSS, Lucide React, Recharts, Firebase Storage.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, Neon PostgreSQL, Vercel Serverless Functions.

*Auto-deployed to Vercel on git push to main.*
