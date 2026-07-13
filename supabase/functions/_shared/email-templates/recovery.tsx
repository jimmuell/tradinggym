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
        /* Force-restore button colors in clients that still invert */
        @media (prefers-color-scheme: dark) {
          .btn-reset { background-color: #2563eb !important; }
          .btn-reset-label, .btn-reset a { color: #ffffff !important; }
        }
        [data-ogsc] .btn-reset { background-color: #2563eb !important; }
        [data-ogsc] .btn-reset-label { color: #ffffff !important; }
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
          <span style={buttonLabel} className="btn-reset-label">Reset Password</span>
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
  backgroundColor: 'hsl(217, 91%, 60%)',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  borderRadius: '8px',
  padding: '12px 20px',
  textDecoration: 'none',
}
// Wrapping label keeps text white when dark-mode email clients
// (Gmail/Outlook) try to invert button text colors.
const buttonLabel = {
  color: '#ffffff',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
