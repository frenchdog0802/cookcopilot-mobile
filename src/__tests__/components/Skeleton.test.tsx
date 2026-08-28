import React from 'react';
import { render } from '@testing-library/react-native';
import { Skeleton, SkeletonList } from '../../components/ui/Skeleton';
import { CachedImage } from '../../components/ui/CachedImage';

describe('Skeleton', () => {
  it('renders list skeleton rows', () => {
    const { toJSON } = render(<SkeletonList count={3} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders a single skeleton bar', () => {
    const { toJSON } = render(<Skeleton height={12} width="50%" />);
    expect(toJSON()).toBeTruthy();
  });
});

describe('CachedImage', () => {
  it('renders placeholder when uri is missing', () => {
    const { toJSON } = render(<CachedImage uri={null} style={{ width: 40, height: 40 }} />);
    expect(toJSON()).toBeTruthy();
  });
});
