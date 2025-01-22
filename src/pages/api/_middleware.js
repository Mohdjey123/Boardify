// pages/api/_middleware.js
export { default } from 'next-connect';
import cors from 'cors';

const corsMiddleware = cors({
  origin: [
    'https://boardify-puce.vercel.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
});

export default function middleware(req, res) {
  return corsMiddleware(req, res, () => {});
}