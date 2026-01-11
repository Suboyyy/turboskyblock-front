import axios from 'axios';

const API_URL = 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
});

export interface Recipe {
  id: string;
  name: string;
  ingredients: { itemId: string; quantity: number }[];
  output: number;
  isBase?: boolean;
}

export interface Project {
  id: string;
  name: string;
  targetRecipeId: string;
  targetQuantity: number;
  maxDepth: number;
  items: Record<string, { itemId: string; baseQuantity: number; targetQuantity: number; currentQuantity: number }>;
  createdAt: string;
  updatedAt: string;
}

// Recipes API
export const recipesApi = {
  getAll: () => api.get<Recipe[]>('/recipes'),
  getOne: (id: string) => api.get<Recipe>(`/recipes/${id}`),
  create: (recipe: Omit<Recipe, 'id'>) => api.post<Recipe>('/recipes', recipe),
  update: (id: string, recipe: Partial<Recipe>) => api.put<Recipe>(`/recipes/${id}`, recipe),
  delete: (id: string) => api.delete(`/recipes/${id}`),
  calculate: (id: string, quantity: number, maxDepth?: number) => 
    api.get(`/recipes/${id}/calculate`, { params: { quantity, maxDepth } }),
};

// Projects API
export const projectsApi = {
  getAll: () => api.get<Project[]>('/projects'),
  getOne: (id: string) => api.get<Project>(`/projects/${id}`),
  create: (project: Omit<Project, 'id' | 'items' | 'createdAt' | 'updatedAt'>) => 
    api.post<Project>('/projects', project),
  updateItem: (projectId: string, itemId: string, quantity: number) =>
    api.put(`/projects/${projectId}/items/${itemId}`, { quantity }),
  updateNode: (projectId: string, path: string[], currentQuantity: number) =>
    api.put(`/projects/${projectId}/nodes`, { path, currentQuantity }),
  updateNodeRequired: (projectId: string, path: string[], quantity: number) =>
    api.put(`/projects/${projectId}/nodes/required`, { path, quantity }),
  delete: (id: string) => api.delete(`/projects/${id}`),
  getProgress: (id: string) => api.get(`/projects/${id}/progress`),
};