import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface SearchInputProps {
	value: string
	onChange: (value: string) => void
	placeholder?: string
	ariaLabel?: string
}

function SearchInput({
	value,
	onChange,
	placeholder = 'Buscar...',
	ariaLabel = 'Buscar',
}: SearchInputProps) {
	return (
		<div className="relative">
			<Search className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-outline" aria-hidden="true" />
			<Input
				className="h-12 rounded-lg border-transparent bg-surface-container pl-10 text-sm text-on-surface placeholder:text-on-surface-variant focus-visible:border-primary focus-visible:bg-surface-container-lowest focus-visible:ring-primary/15"
				type="search"
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				aria-label={ariaLabel}
			/>
		</div>
	)
}

export default SearchInput
