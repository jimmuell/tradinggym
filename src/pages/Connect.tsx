import { useState } from 'react';
import { Check, Copy, Plug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PageSeo from '@/components/seo/PageSeo';

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? '';
const mcpUrl = `https://${projectRef}.supabase.co/functions/v1/mcp`;

function UrlBox() {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(mcpUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-2">
      <code className="flex-1 truncate px-2 text-sm font-mono">{mcpUrl}</code>
      <Button size="sm" variant="secondary" onClick={copy} className="shrink-0">
        {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}

export default function Connect() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <PageSeo
        title="Connect TradingGYM to your AI assistant"
        description="Connect ChatGPT or Claude to TradingGYM so it can read your strategies and backtest results."
        path="/connect"
      />

      <div className="flex items-center gap-3">
        <div className="rounded-md bg-primary/10 text-primary p-2">
          <Plug className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Connect to an AI assistant</h1>
          <p className="text-sm text-muted-foreground">
            Let ChatGPT or Claude use TradingGYM as you — read your strategies and backtest results
            straight from a chat.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">TradingGYM MCP server URL</CardTitle>
          <CardDescription>
            Paste this URL when you add TradingGYM as a connector. You'll sign in with your
            TradingGYM account during setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UrlBox />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connect</CardTitle>
          <CardDescription>Pick your assistant and follow the steps.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chatgpt">
            <TabsList>
              <TabsTrigger value="chatgpt">ChatGPT</TabsTrigger>
              <TabsTrigger value="claude">Claude</TabsTrigger>
            </TabsList>

            <TabsContent value="chatgpt" className="pt-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Open{' '}
                  <a
                    className="text-primary underline"
                    href="https://chatgpt.com/#settings/Connectors/Advanced"
                    target="_blank"
                    rel="noreferrer"
                  >
                    ChatGPT → Settings → Connectors → Advanced
                  </a>{' '}
                  and enable <strong>Developer mode</strong> (read the notice shown there).
                </li>
                <li>
                  In the chat composer's <strong>+</strong> menu, turn on{' '}
                  <strong>Developer mode</strong>.
                </li>
                <li>
                  Click <strong>Add sources</strong>, then <strong>Connect more</strong>.
                </li>
                <li>Name the connector "TradingGYM" and paste the URL above.</li>
                <li>Sign in with your TradingGYM account when prompted, then approve access.</li>
                <li>Ask ChatGPT something like "List my latest backtest runs from TradingGYM."</li>
              </ol>
            </TabsContent>

            <TabsContent value="claude" className="pt-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Open{' '}
                  <a
                    className="text-primary underline"
                    href="https://claude.ai/customize/connectors?modal=add-custom-connector"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Claude → Connectors → Add custom connector
                  </a>
                  .
                </li>
                <li>Name the connector "TradingGYM" and paste the URL above.</li>
                <li>Sign in with your TradingGYM account when prompted, then approve access.</li>
                <li>Enable the connector from the chat composer.</li>
                <li>Ask Claude something like "Show me my TradingGYM strategies."</li>
              </ol>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Refresh after the app changes</CardTitle>
          <CardDescription>
            When we ship new tools or updates, refresh the connector so your assistant sees them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chatgpt">
            <TabsList>
              <TabsTrigger value="chatgpt">ChatGPT</TabsTrigger>
              <TabsTrigger value="claude">Claude</TabsTrigger>
            </TabsList>

            <TabsContent value="chatgpt" className="pt-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Open ChatGPT's app preferences and pick TradingGYM under "Enabled apps".</li>
                <li>
                  Next to <strong>Information</strong>, click <strong>Refresh</strong>.
                </li>
                <li>If the URL changed, paste the latest URL from above.</li>
                <li>Start a new chat and ask ChatGPT to use TradingGYM.</li>
              </ol>
            </TabsContent>

            <TabsContent value="claude" className="pt-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Open the Connectors page and select TradingGYM.</li>
                <li>Refresh or update the connector's tools.</li>
                <li>If the URL changed, paste the latest URL from above.</li>
                <li>Ask Claude to use TradingGYM.</li>
              </ol>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Your assistant acts as you and is subject to your TradingGYM account's permissions. You can
        disconnect the connector from your assistant at any time.
      </p>
    </div>
  );
}
