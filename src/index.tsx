import React, { useMemo } from 'react';
import { View, Text, TextStyle, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import barcodes from 'jsbarcode/src/barcodes';
import PropTypes from 'prop-types';

export type Format =
  | 'CODE39'
  | 'CODE128'
  | 'CODE128A'
  | 'CODE128B'
  | 'CODE128C'
  | 'EAN13'
  | 'EAN8'
  | 'EAN5'
  | 'EAN2'
  | 'UPC'
  | 'UPCE'
  | 'ITF14'
  | 'ITF'
  | 'MSI'
  | 'MSI10'
  | 'MSI11'
  | 'MSI1010'
  | 'MSI1110'
  | 'pharmacode'
  | 'codabar';

export interface BarcodeProps {
  value: string;
  width?: number;
  maxWidth?: number;
  height?: number;
  format?: Format;
  lineColor?: string;
  background?: string;
  text?: React.ReactNode;
  textStyle?: TextStyle;
  style?: ViewStyle;
  onError?: (err: any) => void;
}

export default function Barcode(props: BarcodeProps) {
  const {
    value = '',
    width = 2,
    height = 100,
    format = 'CODE128',
    lineColor = '#000000',
    background = '#ffffff',
    text,
    textStyle,
    style,
    onError,
    maxWidth,
  } = props;

  const drawRect = (x: number, y: number, w: number, h: number) => {
    return `M${x},${y}h${w}v${h}h-${w}z`;
  };

  const drawSvgBarCode = (encoded: any) => {
    const rects = [];
    const { data: binary } = encoded;

    const barCodeWidth = binary.length * width;
    const singleBarWidth =
      typeof maxWidth === 'number' && barCodeWidth > maxWidth
        ? maxWidth / binary.length
        : width;
    let barWidth = 0;
    let x = 0;
    let yFrom = 0;

    for (let b = 0; b < binary.length; b++) {
      x = b * singleBarWidth;
      if (binary[b] === '1') {
        barWidth++;
      } else if (barWidth > 0) {
        rects[rects.length] = drawRect(
          x - singleBarWidth * barWidth,
          yFrom,
          singleBarWidth * barWidth,
          height
        );
        barWidth = 0;
      }
    }
    if (barWidth > 0) {
      rects[rects.length] = drawRect(
        x - singleBarWidth * (barWidth - 1),
        yFrom,
        singleBarWidth * barWidth,
        height
      );
    }
    return rects;
  };

  const encode = (textEncode: string, Encoder: any) => {
    if (typeof textEncode !== 'string' || textEncode.length === 0) {
      throw new Error('Barcode value must be a non-empty string');
    }
    const encoder = new Encoder(textEncode, {
      width,
      format,
      height,
      lineColor,
      background,
      flat: true,
    });
    if (!encoder.valid()) {
      throw new Error('Invalid barcode for selected format.');
    }
    return encoder.encode();
  };

  const { bars, barCodeWidth } = useMemo(() => {
    try {
      const encoder = barcodes[format];
      if (!encoder) {
        throw new Error('Invalid barcode format.');
      }
      const encoded = encode(value, encoder);
      const barWidth = encoded.data.length * width;
      return {
        bars: drawSvgBarCode(encoded),
        barCodeWidth:
          typeof maxWidth === 'number' && barWidth > maxWidth
            ? maxWidth
            : barWidth,
      };
    } catch (error: any) {
      if (__DEV__) {
        console.error(error);
      }
      if (onError) {
        onError(error);
      }
    }
    return {
      bars: [],
      barCodeWidth: 0,
    };
  }, [value, width, height, format, lineColor, background, maxWidth]);

  return (
    <View
      style={[{ backgroundColor: background, alignItems: 'center' }, style]}
    >
      <Svg height={height} width={barCodeWidth} fill={lineColor}>
        <Path d={bars.join(' ')} />
      </Svg>
      {text && <Text style={[{ textAlign: 'center' }, textStyle]}>{text}</Text>}
    </View>
  );
}

Barcode.propTypes = {
  value: PropTypes.string.isRequired,
  format: PropTypes.oneOf(Object.keys(barcodes)),
  width: PropTypes.number,
  maxWidth: PropTypes.number,
  height: PropTypes.number,
  lineColor: PropTypes.string,
  background: PropTypes.string,
  text: PropTypes.node,
  textStyle: PropTypes.object,
  style: PropTypes.object,
  onError: PropTypes.func,
};
