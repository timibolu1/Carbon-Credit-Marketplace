import { describe, it, expect, beforeEach } from 'vitest';

// Mock implementation for testing Clarity contracts
const mockClarity = () => {
  let admin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
  let projects = new Map();
  let nextProjectId = 1;
  
  return {
    getAdmin: () => admin,
    registerProject: (sender, description, location, methodology) => {
      const projectId = nextProjectId;
      projects.set(projectId, {
        owner: sender,
        description,
        location,
        methodology,
        status: 0,
        verificationDate: 0
      });
      nextProjectId++;
      return { ok: projectId };
    },
    verifyProject: (sender, projectId) => {
      if (sender !== admin) return { err: 403 };
      if (!projects.has(projectId)) return { err: 404 };
      
      const project = projects.get(projectId);
      project.status = 1;
      project.verificationDate = 100; // Mock block height
      projects.set(projectId, project);
      return { ok: true };
    },
    rejectProject: (sender, projectId) => {
      if (sender !== admin) return { err: 403 };
      if (!projects.has(projectId)) return { err: 404 };
      
      const project = projects.get(projectId);
      project.status = 2;
      projects.set(projectId, project);
      return { ok: true };
    },
    getProject: (projectId) => {
      return projects.get(projectId) || null;
    },
    transferAdmin: (sender, newAdmin) => {
      if (sender !== admin) return { err: 403 };
      admin = newAdmin;
      return { ok: true };
    },
    _getProjects: () => projects
  };
};

describe('Project Verification Contract', () => {
  let contract;
  
  beforeEach(() => {
    contract = mockClarity();
  });
  
  it('should register a new project', () => {
    const sender = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
    const result = contract.registerProject(
        sender,
        'Reforestation Project',
        'Amazon Rainforest',
        'VCS VM0007'
    );
    
    expect(result.ok).toBe(1);
    
    const project = contract.getProject(1);
    expect(project).not.toBeNull();
    expect(project.owner).toBe(sender);
    expect(project.description).toBe('Reforestation Project');
    expect(project.status).toBe(0); // Pending
  });
  
  it('should verify a project as admin', () => {
    const sender = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
    contract.registerProject(
        sender,
        'Reforestation Project',
        'Amazon Rainforest',
        'VCS VM0007'
    );
    
    const admin = contract.getAdmin();
    const result = contract.verifyProject(admin, 1);
    
    expect(result.ok).toBe(true);
    
    const project = contract.getProject(1);
    expect(project.status).toBe(1); // Verified
    expect(project.verificationDate).toBe(100);
  });
  
  it('should reject verification from non-admin', () => {
    const sender = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
    contract.registerProject(
        sender,
        'Reforestation Project',
        'Amazon Rainforest',
        'VCS VM0007'
    );
    
    const result = contract.verifyProject(sender, 1);
    
    expect(result.err).toBe(403);
    
    const project = contract.getProject(1);
    expect(project.status).toBe(0); // Still pending
  });
  
  it('should reject a project as admin', () => {
    const sender = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
    contract.registerProject(
        sender,
        'Reforestation Project',
        'Amazon Rainforest',
        'VCS VM0007'
    );
    
    const admin = contract.getAdmin();
    const result = contract.rejectProject(admin, 1);
    
    expect(result.ok).toBe(true);
    
    const project = contract.getProject(1);
    expect(project.status).toBe(2); // Rejected
  });
  
  it('should transfer admin rights', () => {
    const admin = contract.getAdmin();
    const newAdmin = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    
    const result = contract.transferAdmin(admin, newAdmin);
    
    expect(result.ok).toBe(true);
    expect(contract.getAdmin()).toBe(newAdmin);
  });
});
