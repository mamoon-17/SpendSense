import React, { useState } from 'react';
import { Mail, Link2, Users, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface InviteDialogProps {
  budgetId: string;
  budgetName: string;
  trigger?: React.ReactNode;
}

export const InviteDialog: React.FC<InviteDialogProps> = ({ budgetId, budgetName, trigger }) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('viewer');
  const [shareLink, setShareLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateShareLink = () => {
    const link = `${window.location.origin}/budget/shared/${budgetId}?permission=${permission}`;
    setShareLink(link);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      toast({
        title: 'Link copied!',
        description: 'The share link has been copied to your clipboard.',
      });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually.',
        variant: 'destructive',
      });
    }
  };

  const sendEmailInvite = async () => {
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter an email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Invitation sent!',
        description: `Invitation sent to ${email} with ${permission} permissions.`,
      });
      
      setEmail('');
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Failed to send invitation',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const permissionOptions = [
    { value: 'viewer', label: 'Viewer', description: 'Can only view the budget' },
    { value: 'contributor', label: 'Contributor', description: 'Can add expenses and savings' },
    { value: 'editor', label: 'Editor', description: 'Can edit existing items' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
            <Users className="w-4 h-4 mr-2" />
            Invite
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Collaborators</DialogTitle>
          <DialogDescription>
            Invite people to collaborate on "{budgetName}" budget
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Invite
            </TabsTrigger>
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Share Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="permission">Permission Level</Label>
              <Select value={permission} onValueChange={setPermission}>
                <SelectTrigger>
                  <SelectValue placeholder="Select permission level" />
                </SelectTrigger>
                <SelectContent>
                  {permissionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={sendEmailInvite} disabled={isLoading} className="w-full">
              {isLoading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="permission-link">Permission Level</Label>
              <Select value={permission} onValueChange={setPermission}>
                <SelectTrigger>
                  <SelectValue placeholder="Select permission level" />
                </SelectTrigger>
                <SelectContent>
                  {permissionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={generateShareLink} variant="outline" className="w-full">
              Generate Share Link
            </Button>

            {shareLink && (
              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareLink}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button 
                    onClick={copyToClipboard}
                    size="icon"
                    variant="outline"
                    className="shrink-0"
                  >
                    {linkCopied ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    {permissionOptions.find(p => p.value === permission)?.label}
                  </Badge>
                  Anyone with this link can {permissionOptions.find(p => p.value === permission)?.description.toLowerCase()}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Current Collaborators */}
        <div className="border-t pt-4">
          <Label className="text-sm font-medium mb-3 block">Current Collaborators</Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-foreground">YO</span>
                </div>
                <div>
                  <p className="text-sm font-medium">You</p>
                  <p className="text-xs text-muted-foreground">Owner</p>
                </div>
              </div>
              <Badge>Owner</Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};