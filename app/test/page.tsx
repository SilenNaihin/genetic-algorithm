'use client';

import { useState } from 'react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ProgressBar } from '../components/common/ProgressBar';

/**
 * Test page for verifying React components during migration.
 * Visit /test to see these components rendered.
 */
export default function TestPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [progress, setProgress] = useState(45);

  return (
    <div style={{ padding: '2rem', background: '#0f0f14', minHeight: '100vh', color: '#e0e0e0' }}>
      <h1 style={{ marginBottom: '2rem' }}>Component Test Page</h1>

      {/* Buttons */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Buttons</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="primary" size="small">Small Primary</Button>
          <Button variant="secondary" size="small">Small Secondary</Button>
          <Button variant="primary" disabled>Disabled</Button>
          <Button variant="icon" onClick={() => alert('Icon clicked!')}>×</Button>
        </div>
      </section>

      {/* Progress Bar */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Progress Bar</h2>
        <div style={{ maxWidth: '400px' }}>
          <ProgressBar value={progress} label="Simulating..." showPercentage />
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <Button size="small" onClick={() => setProgress(Math.max(0, progress - 10))}>-10</Button>
            <Button size="small" onClick={() => setProgress(Math.min(100, progress + 10))}>+10</Button>
            <Button size="small" variant="secondary" onClick={() => setProgress(0)}>Reset</Button>
          </div>
        </div>
      </section>

      {/* Modal */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Modal</h2>
        <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Test Modal"
        >
          <p style={{ marginBottom: '1rem' }}>This is modal content. Press ESC or click outside to close.</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button onClick={() => setIsModalOpen(false)}>Close</Button>
            <Button variant="secondary" onClick={() => alert('Action!')}>Do Something</Button>
          </div>
        </Modal>
      </section>

      {/* Back link */}
      <section>
        <a href="/" style={{ color: '#60a5fa' }}>← Back to main app</a>
      </section>
    </div>
  );
}
