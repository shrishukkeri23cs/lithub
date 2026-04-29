export const getLibrary = () => {
  const saved = localStorage.getItem('lithub-library');
  return saved ? JSON.parse(saved) : [];
};

export const saveToLibrary = (item, groupId = null) => {
  const library = getLibrary();
  if (library.find(i => i.id === item.id)) return false;
  
  const newItem = {
    ...item,
    groupId,
    savedAt: new Date().toISOString()
  };
  
  const updated = [newItem, ...library];
  localStorage.setItem('lithub-library', JSON.stringify(updated));
  return true;
};

export const removeFromLibrary = (id) => {
  const library = getLibrary();
  const updated = library.filter(i => i.id !== id);
  localStorage.setItem('lithub-library', JSON.stringify(updated));
  return updated;
};

export const getGroups = () => {
  const saved = localStorage.getItem('lithub-groups');
  return saved ? JSON.parse(saved) : [];
};

export const createGroup = (name, initialItemIds = []) => {
  const groups = getGroups();
  const groupId = Date.now().toString();
  const newGroup = { 
    id: groupId, 
    name,
    cachedReviews: {},
    reviewStates: {} // Will store hash/ids of items when review was generated per level
  };
  
  const updatedGroups = [...groups, newGroup];
  localStorage.setItem('lithub-groups', JSON.stringify(updatedGroups));

  if (initialItemIds.length > 0) {
    const library = getLibrary();
    const updatedLib = library.map(item => 
      initialItemIds.includes(item.id) ? { ...item, groupId } : item
    );
    localStorage.setItem('lithub-library', JSON.stringify(updatedLib));
  }
  
  return updatedGroups;
};

export const deleteGroup = (id) => {
  const groups = getGroups();
  const updated = groups.filter(g => g.id !== id);
  localStorage.setItem('lithub-groups', JSON.stringify(updated));
  
  // Reassign items in this group back to no group
  const library = getLibrary();
  const updatedLib = library.map(item => item.groupId === id ? { ...item, groupId: null } : item);
  localStorage.setItem('lithub-library', JSON.stringify(updatedLib));
  
  return updated;
};

export const setItemGroup = (itemId, groupId) => {
  const library = getLibrary();
  const updated = library.map(item => item.id === itemId ? { ...item, groupId: null ? null : groupId } : item);
  localStorage.setItem('lithub-library', JSON.stringify(updated));
  return updated;
};

export const saveGroupReview = (groupId, report, items, level = 'deep') => {
  const groups = getGroups();
  const itemState = items.map(i => i.id).sort().join(',');
  const updated = groups.map(g => {
    if (g.id === groupId) {
      return { 
        ...g, 
        cachedReviews: { ...(g.cachedReviews || {}), [level]: report },
        reviewStates: { ...(g.reviewStates || {}), [level]: itemState }
      };
    }
    return g;
  });
  localStorage.setItem('lithub-groups', JSON.stringify(updated));
  return updated;
};

export const getGroupReview = (groupId, currentItems, level = 'deep') => {
  const group = getGroups().find(g => g.id === groupId);
  if (!group || !group.cachedReviews || !group.cachedReviews[level]) return null;
  
  const currentState = currentItems.map(i => i.id).sort().join(',');
  if (!group.reviewStates || group.reviewStates[level] !== currentState) return null;
  
  return group.cachedReviews[level];
};
