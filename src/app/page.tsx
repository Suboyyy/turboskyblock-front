'use client';

import { useEffect, useState, useCallback, startTransition } from 'react';
import { Card, Row, Col, Button, ProgressBar, Badge } from 'react-bootstrap';
import Link from 'next/link';
import { projectsApi, recipesApi, Project, Recipe } from '../lib/api';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [progressData, setProgressData] = useState<Record<string, { progress: number }>>({});

  const loadData = useCallback(async () => {
    try {
      const [projectsRes, recipesRes] = await Promise.all([
        projectsApi.getAll(),
        recipesApi.getAll(),
      ]);
      startTransition(() => {
        setProjects(projectsRes.data);
        setRecipes(recipesRes.data);
      });

      const progressPromises = projectsRes.data.map(p =>
        projectsApi.getProgress(p.id).then(res => ({ id: p.id, data: res.data }))
      );
      const progressResults = await Promise.all(progressPromises);
      const progressMap: Record<string, { progress: number }> = {};
      progressResults.forEach(r => {
        progressMap[r.id] = { progress: r.data?.progress ?? 0 };
      });
      startTransition(() => {
        setProgressData(progressMap);
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const deleteProject = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      try {
        await projectsApi.delete(id);
        loadData();
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const getRecipeName = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    return recipe?.name || recipeId;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>📊 Dashboard</h1>
        <Link href="/projects/new">
          <Button variant="primary" size="lg">
            ➕ Nouveau Projet
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card className="text-center p-5">
          <Card.Body>
            <h3 className="text-muted">Aucun projet en cours</h3>
            <p className="text-muted">Créez votre premier projet de craft !</p>
            <Link href="/projects/new">
              <Button variant="primary" size="lg">Créer un projet</Button>
            </Link>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {projects.map(project => {
            const progress = progressData[project.id];
            const overallProgress = progress ? progress.progress : 0;

            return (
              <Col key={project.id} md={6} lg={4} className="mb-4">
                <Card>
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <strong>{project.name}</strong>
                    <Badge bg={overallProgress === 100 ? 'success' : 'primary'}>
                      {overallProgress.toFixed(0)}%
                    </Badge>
                  </Card.Header>
                  <Card.Body>
                    <p className="mb-2">
                      <strong>Objectif:</strong> {getRecipeName(project.targetRecipeId)}
                    </p>
                    <p className="mb-2">
                      <strong>Quantité:</strong> {project.targetQuantity}
                    </p>
                    <p className="mb-3">
                      <strong>Profondeur:</strong> {project.maxDepth === Infinity ? '∞' : project.maxDepth}
                    </p>

                    <ProgressBar 
                      now={overallProgress} 
                      label={`${overallProgress.toFixed(0)}%`}
                      variant={overallProgress === 100 ? 'success' : 'primary'}
                      className="mb-3"
                    />

                    <div className="d-flex gap-2">
                      <Link href={`/projects/${project.id}`} className="flex-grow-1">
                        <Button variant="outline-primary" className="w-100">
                          📈 Voir le suivi
                        </Button>
                      </Link>
                      <Button 
                        variant="outline-danger" 
                        onClick={() => deleteProject(project.id)}
                      >
                        🗑️
                      </Button>
                    </div>
                  </Card.Body>
                  <Card.Footer className="text-muted small">
                    Créé le {new Date(project.createdAt).toLocaleDateString('fr-FR')}
                  </Card.Footer>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <Card className="mt-5">
        <Card.Header>
          <strong>📚 Statistiques rapides</strong>
        </Card.Header>
        <Card.Body>
          <Row className="text-center">
            <Col md={4}>
              <h2 className="text-primary">{projects.length}</h2>
              <p className="text-muted">Projets actifs</p>
            </Col>
            <Col md={4}>
              <h2 className="text-success">{recipes.length}</h2>
              <p className="text-muted">Recettes configurées</p>
            </Col>
            <Col md={4}>
              <h2 className="text-info">
                {projects.filter(p => {
                  const prog = progressData[p.id];
                  return prog && prog.progress === 100;
                }).length}
              </h2>
              <p className="text-muted">Projets terminés</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
}