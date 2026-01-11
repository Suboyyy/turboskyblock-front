'use client';

import { useEffect, useState, useCallback, startTransition } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { recipesApi, projectsApi, Recipe } from '../../../lib/api';

export default function NewProjectPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    targetRecipeId: '',
    targetQuantity: 1,
    maxDepth: 10,
  });
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.targetRecipeId) {
      setError('Veuillez sélectionner une recette dans la liste');
      return;
    }

    try {
      const res = await projectsApi.create(formData);
      router.push(`/projects/${res.data.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Erreur lors de la création du projet');
    }
  };

  const recipeOptions = recipes.map(r => ({
    value: r.id,
    label: `${r.name} ${r.isBase ? '(Base)' : '(Craft)'}`,
  }));

  const filteredOptions = recipeOptions.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectOption = (opt: { value: string; label: string }) => {
    setFormData(prev => ({ ...prev, targetRecipeId: opt.value }));
    setSearchQuery(opt.label);
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
    <div className="row justify-content-center">
      <div className="col-lg-8">
        <h1 className="mb-4">➕ Nouveau Projet de Craft</h1>

        {error && <Alert variant="danger">{error}</Alert>}

        <Card>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Nom du projet</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ex: Obtenir des Enchanted Gold Blocks"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Form.Text className="text-muted">
                  Donnez un nom descriptif à votre projet
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Recette cible</Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type="text"
                    placeholder="Tapez pour rechercher et sélectionner..."
                    value={searchQuery}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setFormData(prev => ({ ...prev, targetRecipeId: '' })); // reset until chosen
                      setShowSuggestions(true);
                      setHighlightedIndex(-1);
                    }}
                    onKeyDown={handleKeyDown}
                  />
                  {showSuggestions && filteredOptions.length > 0 && (
                    <div
                      className="list-group position-absolute w-100"
                      style={{ zIndex: 1000, top: '100%' }}
                    >
                      {filteredOptions.map((opt, idx) => (
                        <button
                          type="button"
                          key={opt.value}
                          className={`list-group-item list-group-item-action ${idx === highlightedIndex ? 'active' : ''}`}
                          onMouseDown={() => selectOption(opt)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Form.Text className="text-muted">
                  Sélectionnez une option dans la liste pour valider.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Quantité souhaitée</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  value={formData.targetQuantity}
                  onChange={e => setFormData({ ...formData, targetQuantity: parseInt(e.target.value) })}
                  required
                />
                <Form.Text className="text-muted">
                  Combien d&apos;unités voulez-vous obtenir ?
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Profondeur de l&apos;arbre de craft</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max="20"
                  value={formData.maxDepth}
                  onChange={e => setFormData({ ...formData, maxDepth: parseInt(e.target.value) })}
                  required
                />
                <Form.Text className="text-muted">
                  Nombre de niveaux à afficher dans l&apos;arbre (1-20). Plus la profondeur est élevée, 
                  plus vous verrez les ressources de base nécessaires.
                </Form.Text>
              </Form.Group>

              <div className="d-flex gap-2">
                <Button variant="primary" type="submit" size="lg">
                  🚀 Créer le projet
                </Button>
                <Button 
                  variant="secondary" 
                  size="lg"
                  onClick={() => router.push('/')}
                >
                  Annuler
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>

        {recipes.length === 0 && (
          <Alert variant="warning" className="mt-4">
            ⚠️ Vous n&apos;avez pas encore créé de recettes. 
            <Alert.Link href="/recipes"> Créez-en une d&apos;abord !</Alert.Link>
          </Alert>
        )}
      </div>
    </div>
  );
}