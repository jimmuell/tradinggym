/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      {/* Opt out of client-side dark-mode color inversion (Apple Mail, Outlook) */}
      <meta name="color-scheme" content="light only" />
      <meta name="supported-color-schemes" content="light only" />
      <style>{`
        :root { color-scheme: light only; supported-color-schemes: light only; }
        /* Use a light button + dark label because AOL/Yahoo dark mode can invert colored buttons */
        @media (prefers-color-scheme: dark) {
          .btn-reset { background-color: #f8fafc !important; color: #0f172a !important; border-color: #93c5fd !important; }
          .btn-reset-label, .btn-reset-label *, .btn-reset a { color: #0f172a !important; -webkit-text-fill-color: #0f172a !important; }
        }
        [data-ogsc] .btn-reset { background-color: #f8fafc !important; color: #0f172a !important; border-color: #93c5fd !important; }
        [data-ogsc] .btn-reset-label, [data-ogsc] .btn-reset-label * { color: #0f172a !important; -webkit-text-fill-color: #0f172a !important; }
      `}</style>
    </Head>
    <Preview>Reset your password for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          We received a request to reset your password for {siteName}. Click
          the button below to choose a new password.
        </Text>
        <Button style={button} href={confirmationUrl} className="btn-reset">
          <span style={buttonLabel} className="btn-reset-label">
            <font color="#0f172a" style={buttonLabelFont}>Reset Password</font>
          </span>
        </Button>
        <Text style={footer}>
          If you didn't request a password reset, you can safely ignore this
          email. Your password will not be changed.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(222.2, 47.4%, 11.2%)',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: 'hsl(215.4, 16.3%, 46.9%)',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const button = {
  backgroundColor: '#f8fafc',
  background: '#f8fafc',
  color: '#0f172a',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  borderRadius: '8px',
  border: '1px solid #93c5fd',
  padding: '12px 20px',
  textDecoration: 'none',
}
// Use dark text on a light button so aggressive email dark-mode inversion
// (AOL/Yahoo) flips the pair into a readable light-on-dark treatment.
const buttonLabel = {
  color: '#0f172a',
  WebkitTextFillColor: '#0f172a',
  textShadow: '0 0 0 #0f172a',
  textDecoration: 'none',
}
const buttonLabelFont = {
  color: '#0f172a',
  WebkitTextFillColor: '#0f172a',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
