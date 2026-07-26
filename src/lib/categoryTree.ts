export interface CategoryTreeInput {
  id: string;
  parent_id: string | null;
}

export type CategoryNode<T> = T & { children: CategoryNode<T>[] };

// Builds an arbitrarily deep category tree from a flat, parent_id-linked list.
export function buildCategoryTree<T extends CategoryTreeInput>(categories: T[]): CategoryNode<T>[] {
  const nodeById = new Map<string, CategoryNode<T>>();
  categories.forEach((c) => nodeById.set(c.id, { ...c, children: [] }));

  const roots: CategoryNode<T>[] = [];
  categories.forEach((c) => {
    const node = nodeById.get(c.id)!;
    const parent = c.parent_id ? nodeById.get(c.parent_id) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

// If the tree has a single synthetic root (e.g. "Konstruktoriai"), surface its
// children as the top level instead of showing the root as a sibling of its own children.
export function topLevelCategories<T>(roots: CategoryNode<T>[]): CategoryNode<T>[] {
  return roots.length === 1 ? roots[0].children : roots;
}

// Flattens a tree into depth-first order with each node's depth (0 = top level),
// for rendering as an indented flat list (e.g. a <select>).
export function flattenWithDepth<T>(nodes: CategoryNode<T>[], depth = 0): { node: CategoryNode<T>; depth: number }[] {
  return nodes.flatMap((node) => [
    { node, depth },
    ...flattenWithDepth(node.children, depth + 1),
  ]);
}

// Returns the set of all descendant ids (children, grandchildren, …) for a given parentId.
export function getAllDescendantIds(categories: CategoryTreeInput[], parentId: string): Set<string> {
  const result = new Set<string>();
  const queue = [parentId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const c of categories) {
      if (c.parent_id === current) {
        result.add(c.id);
        queue.push(c.id);
      }
    }
  }
  return result;
}

// Returns the set of ancestor ids (root -> parent) for the category matching targetId.
export function findAncestorIds(categories: CategoryTreeInput[], targetId: string): Set<string> {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const ancestors = new Set<string>();
  let current = byId.get(targetId);
  while (current?.parent_id) {
    ancestors.add(current.parent_id);
    current = byId.get(current.parent_id);
  }
  return ancestors;
}
