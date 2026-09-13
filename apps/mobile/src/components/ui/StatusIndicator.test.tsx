import React from 'react';

import {StatusIndicator} from './StatusIndicator';
import {renderComponent} from '@/test/testRenderer';

describe('StatusIndicator', () => {
  it('renders check-circle icon when status is done', () => {
    const tree = renderComponent(<StatusIndicator status="done" />);
    const json = tree.toJSON();

    expect(JSON.stringify(json)).toContain('check-circle');
  });

  it('renders error-outline icon when status is notDone', () => {
    const tree = renderComponent(<StatusIndicator status="notDone" />);
    const json = tree.toJSON();
    const output = JSON.stringify(json);

    expect(output).toContain('error-outline');
    expect(output).not.toContain('check-circle');
  });

  it('supports different sizes', () => {
    const treeSm = renderComponent(<StatusIndicator status="done" size="sm" />);
    const treeLg = renderComponent(<StatusIndicator status="done" size="lg" />);

    expect(treeSm.toJSON()).toBeTruthy();
    expect(treeLg.toJSON()).toBeTruthy();
  });
});
