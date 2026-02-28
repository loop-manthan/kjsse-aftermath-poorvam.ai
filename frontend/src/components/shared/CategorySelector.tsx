import { useState, useEffect } from 'react';
import { categoryService } from '../../api/services';
import { Category } from '../../types/category';
import { Check, Search, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategorySelectorProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
  error?: string;
}

export const CategorySelector = ({ selectedCategories, onChange, error }: CategorySelectorProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await categoryService.getAll();
      setCategories(data.categories.filter(cat => cat.isActive));
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleCategory = (categoryName: string) => {
    if (selectedCategories.includes(categoryName)) {
      onChange(selectedCategories.filter(c => c !== categoryName));
    } else {
      onChange([...selectedCategories, categoryName]);
    }
  };

  const getSelectedDisplayNames = () => {
    return categories
      .filter(cat => selectedCategories.includes(cat.name))
      .map(cat => cat.displayName)
      .join(', ');
  };

  if (loading) {
    return (
      <div className="glass-input rounded-xl px-4 py-3 flex items-center gap-3">
        <Briefcase size={20} className="text-white/40" />
        <span className="text-white/40">Loading categories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'glass-input rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer transition-all',
            error && 'border-red-500/50',
            isOpen && 'bg-white/10'
          )}
        >
          <Briefcase size={20} className="text-white/40" />
          <div className="flex-1">
            {selectedCategories.length > 0 ? (
              <span className="text-white">{getSelectedDisplayNames()}</span>
            ) : (
              <span className="text-white/40">Select your skills/categories</span>
            )}
          </div>
          <span className="text-white/60 text-sm">
            {selectedCategories.length > 0 && `(${selectedCategories.length})`}
          </span>
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 glass-card rounded-xl p-4 z-50 max-h-80 overflow-y-auto">
            <div className="glass-input rounded-lg px-3 py-2 flex items-center gap-2 mb-3">
              <Search size={16} className="text-white/40" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent text-white text-sm placeholder:text-white/40 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <label
                    key={category._id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-all group"
                  >
                    <div
                      className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                        selectedCategories.includes(category.name)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-white/30 group-hover:border-white/50'
                      )}
                    >
                      {selectedCategories.includes(category.name) && (
                        <Check size={14} className="text-white" />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.name)}
                      onChange={() => toggleCategory(category.name)}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{category.displayName}</p>
                      {category.description && (
                        <p className="text-white/60 text-xs mt-0.5">{category.description}</p>
                      )}
                    </div>
                  </label>
                ))
              ) : (
                <p className="text-white/60 text-sm text-center py-4">No categories found</p>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-xs px-2">{error}</p>}
      
      {selectedCategories.length > 0 && (
        <p className="text-white/60 text-xs px-2">
          {selectedCategories.length} {selectedCategories.length === 1 ? 'category' : 'categories'} selected
        </p>
      )}
    </div>
  );
};

export default CategorySelector;
