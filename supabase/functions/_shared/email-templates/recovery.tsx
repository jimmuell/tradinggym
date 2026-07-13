/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
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
      <meta name="color-scheme" content="light only" />
      <meta name="supported-color-schemes" content="light only" />
      <style>{`
        :root { color-scheme: light only; supported-color-schemes: light only; }
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      `}</style>
    </Head>
    <Preview>Reset your {siteName} password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>{siteName}</Text>
        </Section>

        <Section style={card}>
          <Heading style={h1}>Reset your password</Heading>
          <Text style={text}>
            We received a request to reset the password on your {siteName}{' '}
            account. Click the button below to choose a new password. This link
            will expire in 60 minutes.
          </Text>

          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button style={button} href={confirmationUrl}>
              Reset password
            </Button>
          </Section>

          <Text style={smallText}>
            Or copy and paste this URL into your browser:
          </Text>
          <Text style={urlText}>
            <Link href={confirmationUrl} style={urlLink}>
              {confirmationUrl}
            </Link>
          </Text>

          <Hr style={hr} />

          <Text style={muted}>
            If you didn't request a password reset, you can safely ignore this
            email — your password will not be changed.
          </Text>
        </Section>

        <Section style={footerSection}>
          <Text style={footer}>
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = {
  backgroundColor: '#f4f6fb',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  margin: 0,
  padding: '40px 0',
}
const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '0 20px',
}
const header = {
  padding: '0 0 20px',
  textAlign: 'center' as const,
}
const brand = {
  fontSize: '20px',
  fontWeight: 700 as const,
  letterSpacing: '0.5px',
  color: '#0f172a',
  margin: 0,
}
const card = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '40px 36px',
  border: '1px solid #e5e7eb',
  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
}
const h1 = {
  fontSize: '22px',
  fontWeight: 700 as const,
  color: '#0f172a',
  margin: '0 0 16px',
  lineHeight: '1.3',
}
const text = {
  fontSize: '15px',
  color: '#334155',
  lineHeight: '1.6',
  margin: '0 0 12px',
}
const button = {
  backgroundColor: '#2563eb',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600 as const,
  borderRadius: '8px',
  padding: '13px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}
const smallText = {
  fontSize: '13px',
  color: '#64748b',
  margin: '0 0 6px',
}
const urlText = {
  fontSize: '13px',
  margin: '0 0 8px',
  wordBreak: 'break-all' as const,
}
const urlLink = {
  color: '#2563eb',
  textDecoration: 'underline',
}
const hr = {
  borderColor: '#e5e7eb',
  margin: '28px 0 20px',
}
const muted = {
  fontSize: '13px',
  color: '#64748b',
  lineHeight: '1.6',
  margin: 0,
}
const footerSection = {
  padding: '20px 0 0',
  textAlign: 'center' as const,
}
const footer = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: 0,
}
