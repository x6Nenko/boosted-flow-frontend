import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PasswordInput = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn('pr-9', className)}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-0 top-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </Button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
