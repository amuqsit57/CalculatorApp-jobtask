import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type MoneyFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
  inputMode?: "decimal" | "numeric";
};

export function MoneyField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  prefix,
  suffix,
  inputMode = "decimal",
}: MoneyFieldProps) {
  const messageId = `${id}-message`;

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      <div className="relative">
        {prefix && (
          <span className="figure pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
            {prefix}
          </span>
        )}
        <Input
          id={id}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? messageId : undefined}
          className={cn(
            "figure h-11 border-input bg-card text-base md:text-base",
            prefix && "pl-7",
            suffix && "pr-16",
          )}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {error ? (
        <p id={messageId} className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
