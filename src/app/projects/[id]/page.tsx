'use client';

import { useEffect, useState, useCallback, startTransition } from 'react';
import { Card, Form, Button, ProgressBar, Badge, Table } from 'react-bootstrap';
import { useParams, useRouter } from 'next/navigation';
import { projectsApi, recipesApi, Project, Recipe } from '../../../lib/api';

interface TreeNode {
  itemId: string;
  itemName: string;
  quantity: number;
  currentQuantity: number;
  progress: number;
  isBase: boolean;
  children: TreeNode[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [progressTree, setProgressTree] = useState<TreeNode | null>(null);
  const [editingPath, setEditingPath] = useState<string[] | null>(null);
  const [tempQuantity, setTempQuantity] = useState<number>(0);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set()); // collapsible branches

  const loadData = useCallback(async () => {
    try {
      const [projectRes, recipesRes, progressRes] = await Promise.all([
        projectsApi.getOne(projectId),
        recipesApi.getAll(),
        projectsApi.getProgress(projectId),
      ]);
      startTransition(() => {
        setProject(projectRes.data);
        setRecipes(recipesRes.data);
        setProgressTree(progressRes.data);
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateQuantity = async (path: string[], quantity: number, node: TreeNode) => {
    try {
      quantity = Math.min(quantity, node.quantity)
      await projectsApi.updateNode(projectId, path, quantity);
      setEditingPath(null);
      loadData();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const startEdit = (path: string[], possessedQty: number) => {
    setEditingPath(path);
    setTempQuantity(possessedQty);
  };

  const cancelEdit = () => {
    setEditingPath(null);
    setTempQuantity(0);
  };

  const toggleCollapse = (pathKey: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(pathKey)) next.delete(pathKey);
      else next.add(pathKey);
      return next;
    });
  };

  const isCollapsed = (pathKey: string) => collapsed.has(pathKey);

  const renderTreeNode = (node: TreeNode, depth: number = 0, path: string[] = []) => {
    const isCompleted = node.progress >= 100;
    const indentStyle = { marginLeft: `${depth * 30}px` };
    const currPath = [...path, node.itemId];
    const pathKey = currPath.join('/');

    return (
      <div key={pathKey} className="mb-2">
        <div className={`tree-node ${isCompleted ? 'completed' : ''}`} style={indentStyle}>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div className="flex-grow-1 d-flex align-items-start">
              {node.children && node.children.length > 0 ? (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="me-2 px-2 py-0"
                  onClick={() => toggleCollapse(pathKey)}
                  aria-expanded={!isCollapsed(pathKey)}
                  aria-label={isCollapsed(pathKey) ? 'Expand branch' : 'Collapse branch'}
                >
                  {isCollapsed(pathKey) ? '▸' : '▾'}
                </Button>
              ) : (
                <span className="me-2" style={{ width: '28px' }} />
              )}
              <div>
                <h6 className="mb-1">
                  {node.isBase && '🔹 '}
                  <strong>{node.itemName}</strong>
                </h6>
                <div className="small text-muted">
                  Requis: {node.quantity} | Possédé: {node.currentQuantity}
                </div>
              </div>
            </div>
            <Badge bg={isCompleted ? 'success' : node.progress > 0 ? 'warning' : 'secondary'}>
              {node.progress.toFixed(0)}%
            </Badge>
          </div>

          <ProgressBar 
            now={node.progress} 
            variant={isCompleted ? 'success' : 'primary'}
            className="mb-2"
          />

          {editingPath && editingPath.join('/') === pathKey ? (
            <div className="d-flex gap-2">
              <Form.Control
                type="number"
                min="0"
                value={tempQuantity}
                onChange={e => setTempQuantity(parseInt(e.target.value, 10) || 0)}
                autoFocus
                size="sm"
              />
              <Button 
                size="sm" 
                variant="success"
                onClick={() => updateQuantity(currPath, tempQuantity, node)}
              >
                ✓
              </Button>
              <Button size="sm" variant="secondary" onClick={cancelEdit}>
                ✕
              </Button>
            </div>
          ) : (
            <Button 
              size="sm" 
              variant="outline-primary"
              onClick={() => startEdit(currPath, node.currentQuantity)}
            >
              ✏️ Mettre à jour la quantité
            </Button>
          )}
        </div>

        {!isCollapsed(pathKey) && node.children && node.children.length > 0 && (
          <div className="tree-node-children">
            {node.children.map(child => renderTreeNode(child, depth + 1, currPath))}
          </div>
        )}
      </div>
    );
  };

  const getRecipeName = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    return recipe?.name || recipeId;
  };

  if (!project || !progressTree) {
    return <div className="text-center p-5">Chargement...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>{project.name}</h1>
          <p className="text-muted mb-0">
            Objectif: {project.targetQuantity}x {getRecipeName(project.targetRecipeId)}
          </p>
        </div>
        <Button variant="secondary" onClick={() => router.push('/')}>
          ← Retour
        </Button>
      </div>

      <Card className="mb-4">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <strong>📊 Progression globale</strong>
            <Badge bg={progressTree.progress === 100 ? 'success' : 'primary'} className="fs-6">
              {progressTree.progress.toFixed(1)}%
            </Badge>
          </div>
        </Card.Header>
        <Card.Body>
          <ProgressBar 
            now={progressTree.progress} 
            label={`${progressTree.progress.toFixed(1)}%`}
            variant={progressTree.progress === 100 ? 'success' : 'primary'}
            style={{ height: '30px' }}
          />
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <strong>🌳 Arbre de craft détaillé</strong>
        </Card.Header>
        <Card.Body>
          {renderTreeNode(progressTree)}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <strong>📋 Vue d&apos;ensemble des items</strong>
        </Card.Header>
        <Card.Body>
          <Table responsive hover variant="dark">
            <thead>
              <tr>
                <th>Item</th>
                <th>Requis</th>
                <th>Possédé</th>
                <th>Manquant</th>
                <th>Progression</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(project.items).map(([itemId, itemData]) => {
                const recipe = recipes.find(r => r.id === itemId);
                const progress = Math.min(100, (((itemData.baseQuantity - itemData.targetQuantity) + itemData.currentQuantity) / itemData.baseQuantity) * 100);
                const missing = Math.max(0, itemData.targetQuantity - itemData.currentQuantity);

                return (
                  <tr key={itemId}>
                    <td>
                      <strong>{recipe?.name || itemId}</strong>
                      {recipe?.isBase && <Badge bg="success" className="ms-2">Base</Badge>}
                    </td>
                    <td>{itemData.baseQuantity}</td>
                    <td>{(itemData.baseQuantity - itemData.targetQuantity) + itemData.currentQuantity}</td>
                    <td className={missing > 0 ? 'text-warning' : 'text-success'}>
                      {missing}
                    </td>
                    <td style={{ width: '200px' }}>
                      <ProgressBar 
                        now={progress} 
                        variant={progress === 100 ? 'success' : 'primary'}
                        label={`${progress.toFixed(0)}%`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}