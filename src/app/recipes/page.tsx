'use client';

import { useEffect, useState, useCallback, startTransition, useMemo } from 'react';
import { Card, Button, Table, Modal, Form, Badge } from 'react-bootstrap';
import { recipesApi, Recipe } from '../../lib/api';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    output: 1,
    isBase: false,
    ingredients: [{ itemId: '', quantity: 1 }],
  });

  const loadRecipes = useCallback(async () => {
    try {
      const res = await recipesApi.getAll();
      startTransition(() => {
        setRecipes(res.data);
      });
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const openModal = (recipe?: Recipe) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setFormData({
        name: recipe.name,
        output: recipe.output,
        isBase: recipe.isBase || false,
        ingredients: recipe.ingredients.length > 0 ? recipe.ingredients : [{ itemId: '', quantity: 1 }],
      });
    } else {
      setEditingRecipe(null);
      setFormData({
        name: '',
        output: 1,
        isBase: false,
        ingredients: [{ itemId: '', quantity: 1 }],
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRecipe(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const recipeData = {
        ...formData,
        ingredients: formData.isBase ? [] : formData.ingredients.filter(ing => ing.itemId && ing.quantity > 0),
      };

      if (editingRecipe) {
        await recipesApi.update(editingRecipe.id, recipeData);
      } else {
        await recipesApi.create(recipeData);
      }
      loadRecipes();
      closeModal();
    } catch (error) {
      console.error('Error saving recipe:', error);
    }
  };

  const deleteRecipe = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette recette ?')) {
      try {
        await recipesApi.delete(id);
        loadRecipes();
      } catch (error) {
        console.error('Error deleting recipe:', error);
      }
    }
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { itemId: '', quantity: 1 }],
    });
  };

  const removeIngredient = (index: number) => {
    const newIngredients = formData.ingredients.filter((_, i) => i !== index);
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const updateIngredient = (index: number, field: 'itemId' | 'quantity', value: string | number) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const getRecipeName = (id: string) => {
    const recipe = recipes.find(r => r.id === id);
    return recipe?.name || id;
  };

  // Composant identique au champ de NewProject
  function IngredientTypeahead({
    options,
    value,
    onSelect,
    placeholder,
  }: {
    options: { value: string; label: string }[];
    value: string;
    onSelect: (value: string) => void;
    placeholder?: string;
  }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    // Map mémoisée pour éviter l'effet "missing dependency"
    const optionsMap = useMemo(() => {
      return new Map(options.map(o => [o.value, o.label]));
    }, [options]);

    useEffect(() => {
      if (!value) return;
      const label = optionsMap.get(value);
      if (label) setSearchQuery(label);
    }, [value, optionsMap]);

    const filteredOptions = options.filter(opt =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectOption = (opt: { value: string; label: string }) => {
      onSelect(opt.value);            // update parent only here
      setSearchQuery(opt.label);      // replace typed text
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions && filteredOptions.length > 0 && ['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
        setShowSuggestions(true);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(i => Math.min(i + 1, filteredOptions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          e.preventDefault();
          selectOption(filteredOptions[highlightedIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };

    return (
      <div className="position-relative">
        <Form.Control
          type="text"
          placeholder={placeholder || 'Tapez pour rechercher et sélectionner...'}
          value={searchQuery}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
          onChange={e => {
            setSearchQuery(e.target.value);   // local only; no parent update
            setShowSuggestions(true);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
        />
        {showSuggestions && filteredOptions.length > 0 && (
          <div
            className="list-group position-absolute w-100"
            style={{ zIndex: 1000, top: '100%' }}
            role="listbox"
          >
            {filteredOptions.map((opt, idx) => (
              <button
                type="button"
                key={opt.value}
                className={`list-group-item list-group-item-action ${idx === highlightedIndex ? 'active' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault();         // avoid focus jump on click
                  selectOption(opt);
                }}
                tabIndex={-1}
                role="option"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Options pour les ingrédients (basées sur les recettes)
  const recipeOptions = recipes.map(r => ({
    value: r.id,
    label: `${r.name} ${r.isBase ? '(Base)' : '(Craft)'}`,
  }));

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>📚 Recettes</h1>
        <Button variant="primary" size="lg" onClick={() => openModal()}>
          ➕ Nouvelle Recette
        </Button>
      </div>

      <Card>
        <Card.Body>
          {recipes.length === 0 ? (
            <div className="text-center p-5">
              <h4 className="text-muted">Aucune recette configurée</h4>
              <p className="text-muted">Créez votre première recette pour commencer !</p>
            </div>
          ) : (
            <Table responsive hover variant="dark">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Type</th>
                  <th>Output</th>
                  <th>Ingrédients</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recipes.map(recipe => (
                  <tr key={recipe.id}>
                    <td><strong>{recipe.name}</strong></td>
                    <td>
                      <Badge bg={recipe.isBase ? 'success' : 'info'}>
                        {recipe.isBase ? '🔹 Base' : '⚙️ Craft'}
                      </Badge>
                    </td>
                    <td>{recipe.output}</td>
                    <td>
                      {recipe.isBase ? (
                        <span className="text-muted">Ressource de base</span>
                      ) : (
                        <div>
                          {recipe.ingredients.map((ing) => (
                            <div key={ing.itemId} className="small">
                              • {ing.quantity}x {getRecipeName(ing.itemId)}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => openModal(recipe)}
                      >
                        ✏️
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => deleteRecipe(recipe.id)}
                      >
                        🗑️
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={closeModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingRecipe ? '✏️ Modifier la recette' : '➕ Nouvelle recette'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                placeholder="Ex: Enchanted Gold Ingot"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Control
                type="number"
                min="1"
                value={formData.output}
                onChange={e => setFormData({ ...formData, output: parseInt(e.target.value, 10) })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Check
                type="switch"
                id="isBaseSwitch"
                label="Recette de base (sans ingrédients)"
                checked={formData.isBase}
                onChange={e => setFormData({ ...formData, isBase: e.target.checked })}
              />
            </Form.Group>

            {!formData.isBase && (
              <>
                <h5 className="mb-3">Ingrédients requis</h5>
                {formData.ingredients.map((ing, idx) => (
                  <div key={idx} className="d-flex gap-2 mb-2">
                    <div style={{ flex: 2 }}>
                      <IngredientTypeahead
                        options={recipeOptions}
                        value={ing.itemId}
                        onSelect={(val) => updateIngredient(idx, 'itemId', val)}
                        placeholder="Sélectionner un item..."
                      />
                    </div>
                    <Form.Control
                      type="number"
                      min="1"
                      value={ing.quantity}
                      onChange={e => updateIngredient(idx, 'quantity', parseInt(e.target.value, 10))}
                      placeholder="Qté"
                      required
                      style={{ flex: 1 }}
                    />
                    <Button
                      variant="outline-danger"
                      onClick={() => removeIngredient(idx)}
                      disabled={formData.ingredients.length === 1}
                    >
                      🗑️
                    </Button>
                  </div>
                ))}
                <Button variant="outline-secondary" size="sm" onClick={addIngredient}>
                  ➕ Ajouter un ingrédient
                </Button>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>Annuler</Button>
            <Button variant="primary" type="submit">
              {editingRecipe ? '💾 Enregistrer' : '🚀 Créer'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}