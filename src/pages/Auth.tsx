import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function Auth() {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#131722]">
      <div className="w-full max-w-md px-4">
        <h1 className="text-3xl font-bold text-white text-center mb-8">TradingGym</h1>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#1e222d]">
            <TabsTrigger value="login" className="data-[state=active]:bg-[#2a2e39] data-[state=active]:text-white text-gray-400">
              Log In
            </TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-[#2a2e39] data-[state=active]:text-white text-gray-400">
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="bg-[#1e222d] border-[#2a2e39]">
              <CardHeader>
                <CardTitle className="text-white">Welcome back</CardTitle>
                <CardDescription className="text-gray-400">Enter your credentials to access your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Email</Label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="bg-[#2a2e39] border-[#363a45] text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="bg-[#2a2e39] border-[#363a45] text-white placeholder:text-gray-500"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Log In</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className="bg-[#1e222d] border-[#2a2e39]">
              <CardHeader>
                <CardTitle className="text-white">Create account</CardTitle>
                <CardDescription className="text-gray-400">Get started with TradingGym</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Email</Label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="bg-[#2a2e39] border-[#363a45] text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="bg-[#2a2e39] border-[#363a45] text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Confirm Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={signupConfirm}
                    onChange={(e) => setSignupConfirm(e.target.value)}
                    className="bg-[#2a2e39] border-[#363a45] text-white placeholder:text-gray-500"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Sign Up</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
