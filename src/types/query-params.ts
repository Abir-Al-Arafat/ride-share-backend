export interface CreateUserQueryParams {
  loginAfterCreate?: boolean;
}

export interface IQuery {
  email?: string | { $regex: RegExp };
  roles?: string | { $in: string[] };
  isAffiliate?: boolean;
  isActive?: boolean;
}
