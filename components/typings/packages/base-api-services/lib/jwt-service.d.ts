/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 * 
 * http://aws.amazon.com/apache2.0
 * 
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import jwt from 'jsonwebtoken';

export default JwtService;
declare class JwtService {
  getSecret(): Promise<string>;
  sign(payload: any, optionsOverride?: jwt.SignOptions): Promise<string>;
  verify(token: string): Promise<string | object>;
  /**
   * Decodes a token and either returns the token payload or returns the complete decoded token as
   * { payload, header, signature } based on the "complete" flag.
   *
   * @param token The JWT token to decode
   *
   * @param complete A flag indicating whether to return just the payload or return the whole token in
   * { payload, header, signature } format after decoding. Defaults to true i.e., it returns the whole token.
   *
   * @param ignoreExpiration A flag indicating whether the decoding should ignore token expiration. If this flag is
   * false, the decoding will throw exception if an expired token is being decoded. Defaults to true i.e., it ignores expiration.
   */
  decode(
    token: string,
    {
      complete,
      ignoreExpiration,
    }?: {
      complete?: boolean;
      ignoreExpiration?: boolean;
    },
  ): Promise<string | object>;
}
